import { NavigatorScreenParams } from '@react-navigation/native';
import { TransactionType } from '../types';

export type AuthStackParamList = {
  登录: undefined;
  注册: undefined;
};

export type RecordsStackParamList = {
  记录列表: undefined;
  编辑记账: { transactionId: string };
  分类: { presetType?: TransactionType } | undefined;
};

export type AddStackParamList = {
  新增记账: { presetType?: TransactionType; transactionId?: string } | undefined;
  分类: { presetType?: TransactionType } | undefined;
};

export type MainTabParamList = {
  首页: undefined;
  记录: NavigatorScreenParams<RecordsStackParamList>;
  新增: NavigatorScreenParams<AddStackParamList>;
  报表: undefined;
  设置: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
