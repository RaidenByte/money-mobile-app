import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import { Category, Transaction } from '../types';

type FileSystemModule = typeof import('expo-file-system/legacy');
type SharingModule = typeof import('expo-sharing');

interface ExportTransactionsParams {
  transactions: Transaction[];
  categories: Category[];
  title?: string;
}

interface ExportResult {
  uri: string;
  message: string;
}

const getTimestamp = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${hh}${mm}`;
};

const sortByDateDesc = (items: Transaction[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const loadFileSystem = (): FileSystemModule => {
  try {
    return require('expo-file-system/legacy') as FileSystemModule;
  } catch {
    throw new Error('当前安装包缺少文件导出模块，请重新构建后再试。');
  }
};

const loadSharing = (): SharingModule | null => {
  try {
    return require('expo-sharing') as SharingModule;
  } catch {
    return null;
  }
};

const exportToAndroidDownload = async (
  FileSystem: FileSystemModule,
  base64: string,
  fileName: string,
  mimeType: string,
): Promise<ExportResult | null> => {
  try {
    const downloadUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(downloadUri);
    if (!permission.granted) return null;

    const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      fileName,
      mimeType,
    );
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return {
      uri: targetUri,
      message: `已导出到手机 Download 目录：${fileName}`,
    };
  } catch {
    return null;
  }
};

export const exportTransactionsToExcel = async ({
  transactions,
  categories,
  title = '记账记录',
}: ExportTransactionsParams): Promise<ExportResult> => {
  if (transactions.length === 0) {
    throw new Error('当前没有可导出的记录。');
  }

  const FileSystem = loadFileSystem();
  const Sharing = loadSharing();

  const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
  const sorted = sortByDateDesc(transactions);

  const rows = sorted.map((item, index) => ({
    序号: index + 1,
    日期: item.date,
    类型: item.type === 'income' ? '收入' : '支出',
    分类: categoryMap.get(item.categoryId) ?? '未分类',
    金额: item.amount,
    备注: item.note || '',
  }));

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 26 },
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, '记录');
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

  const fileName = `${title}_${getTimestamp()}.xlsx`;
  const localUri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(localUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (Platform.OS === 'android') {
    const downloadResult = await exportToAndroidDownload(FileSystem, base64, fileName, mimeType);
    if (downloadResult) {
      return downloadResult;
    }

    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permission.granted) {
      const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        fileName,
        mimeType,
      );
      await FileSystem.writeAsStringAsync(targetUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return {
        uri: targetUri,
        message: `已导出到你选择的目录：${fileName}`,
      };
    }
  }

  if (Sharing) {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(localUri, {
        mimeType,
        dialogTitle: '导出 Excel',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
      return {
        uri: localUri,
        message: '已打开分享面板，请选择“保存到文件/下载”。',
      };
    }
  }

  return {
    uri: localUri,
    message: `文件已生成：${localUri}`,
  };
};
