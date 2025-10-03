import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { backendURL } from '../../credentials/TrendswellApi.credentials';

export class Trendswell implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trendswell',
		name: 'trendswell',
		icon: 'file:icons/trendswell.png',
		group: ['transform'],
		version: 1,
		description: 'Custom node for Trendswell search',
		defaults: {
			name: 'Trendswell',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Search Text',
				name: 'searchText',
				type: 'string',
				default: '',
				placeholder: 'Enter keyword or question',
				description: 'Enter keyword or question',
				required: true,
			},
			{
				displayName: 'AI Strength',
				name: 'aiStrength',
				type: 'options',
				options: [
					{ name: 'Basic', value: 'Basic' },
					{ name: 'Premium', value: 'Premium' },
				],
				default: 'Basic',
				description: 'Select AI Strength',
				required: true,
			},
			{
				displayName: 'Country',
				name: 'countryCode',
				type: 'options',
				options: [
					{ name: 'Australia', value: 'AU' },
					{ name: 'Myanmar (Burma)', value: 'MM' },
					{ name: 'Cambodia', value: 'KH' },
					{ name: 'Canada', value: 'CA' },
					{ name: 'Sri Lanka', value: 'LK' },
					{ name: 'Cyprus', value: 'CY' },
					{ name: 'Ghana', value: 'GH' },
					{ name: 'Greece', value: 'GR' },
					{ name: 'Hong Kong', value: 'HK' },
					{ name: 'India', value: 'IN' },
					{ name: 'Indonesia', value: 'ID' },
					{ name: 'Ireland', value: 'IE' },
					{ name: 'Kenya', value: 'KE' },
					{ name: 'Malaysia', value: 'MY' },
					{ name: 'Malta', value: 'MT' },
					{ name: 'New Zealand', value: 'NZ' },
					{ name: 'Nigeria', value: 'NG' },
					{ name: 'Pakistan', value: 'PK' },
					{ name: 'Philippines', value: 'PH' },
					{ name: 'Singapore', value: 'SG' },
					{ name: 'Vietnam', value: 'VN' },
					{ name: 'South Africa', value: 'ZA' },
					{ name: 'United Arab Emirates', value: 'AE' },
					{ name: 'Egypt', value: 'EG' },
					{ name: 'United Kingdom', value: 'GB' },
					{ name: 'United States', value: 'US' },
				],
				default: 'US',
				description: 'Select the country',
				required: true,
			},
			{
				displayName: 'Example 1',
				name: 'example1',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Example 2',
				name: 'example2',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Example 3',
				name: 'example3',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Niche 1',
				name: 'niche1',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Niche 2',
				name: 'niche2',
				type: 'string',
				default: '',
			},
		],
		credentials: [
			{
				name: 'trendswellApi',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const searchText = this.getNodeParameter('searchText', 0) as string;
		const aiStrength = this.getNodeParameter('aiStrength', 0) as string;
		const countryCode = this.getNodeParameter('countryCode', 0) as string;
		const example1 = this.getNodeParameter('example1', 0) as string;
		const example2 = this.getNodeParameter('example2', 0) as string;
		const example3 = this.getNodeParameter('example3', 0) as string;
		const niche1 = this.getNodeParameter('niche1', 0) as string;
		const niche2 = this.getNodeParameter('niche2', 0) as string;

		const credentials = await this.getCredentials('trendswellApi');
		const authToken = credentials.authToken as string;

		const body = {
			searchText,
			aiStrength,
			countryCode,
			examples: [example1, example2, example3].filter(Boolean),
			niches: [niche1, niche2].filter(Boolean),
		};

		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: `${backendURL}/n8n/automated-search`,
			headers: {
				'Content-Type': 'application/json',
				'auth-token': authToken,
			},
			body,
			json: true,
		});

		return [[{ json: response }]];
	}
}
