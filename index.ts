import { TrendswellApi } from './credentials/TrendswellApi.credentials';
import { Trendswell } from './nodes/Trendswell/Trendswell.node';
import { TrendswellTrigger } from './nodes/Trendswell/TrendswellTrigger.node';

export const version = 1;

export const credentials = [TrendswellApi];
export const nodes = [Trendswell, TrendswellTrigger];
