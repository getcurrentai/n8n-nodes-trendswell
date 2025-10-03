import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError,
	NodeConnectionType,
	JsonObject,
} from 'n8n-workflow';
import { backendURL } from '../../credentials/TrendswellApi.credentials';

export class TrendswellTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trendswell Trigger',
		name: 'trendswellTrigger',
		icon: 'file:icons/trendswell.png',
		group: ['trigger'],
		version: 1,
		description: 'Starts workflow when a Trendswell event occurs',
		defaults: { name: 'Trendswell Trigger' },
		inputs: [],
		outputs: [NodeConnectionType.Main],

		credentials: [
			{
				name: 'trendswellApi',
				required: true,
			},
		],

		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'trendswell',
			},
		],

		properties: [
			{
				displayName: 'Webhook For',
				name: 'webhookFor',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Trendswell Searches', value: 'trendswell-searches' }],
				default: 'trendswell-searches',
				description: 'The type of event this webhook should listen for',
			},
		],
	};

	// webhook lifecycle methods: checkExists, create, delete
	webhookMethods = {
		default: {
			/**
			 * checkExists - verifies if subscription already exists
			 * This is optional but required by the INodeType typing (we include it).
			 */
			async checkExists(this: IHookFunctions): Promise<boolean> {
				try {
					// static data stored per node
					const staticData = this.getWorkflowStaticData('node') as any;
					const webhookId = staticData?.webhookId;
					if (!webhookId) {
						return false;
					}

					// Verify with remote API if possible
					const credentials = (await this.getCredentials('trendswellApi')) as {
						authToken?: string;
					};
					const authToken = credentials?.authToken as string | undefined;

					// If there's no auth token, assume it doesn't exist
					if (!authToken) return false;

					// Try to GET the subscription - if returns 200 treat as exists
					await this.helpers.request({
						method: 'GET',
						url: `${backendURL}/n8n/webhooks/${webhookId}`,
						headers: {
							'auth-token': authToken,
							Accept: 'application/json',
						},
						json: true,
					});

					return true;
				} catch (error) {
					// If remote returns 404 or similar, treat as not exists
					return false;
				}
			},

			/**
			 * create - called when workflow is activated
			 */
			async create(this: IHookFunctions): Promise<boolean> {
				try {
					const credentials = await this.getCredentials('trendswellApi');
					const authToken = credentials.authToken as string;

					if (!authToken) {
						throw new NodeOperationError(
							this.getNode(),
							'No auth token available for Trendswell credentials',
						);
					}

					const webhookUrl = this.getNodeWebhookUrl('default');
					const webhookFor = this.getNodeParameter('webhookFor') as string;

					const response = await this.helpers.request({
						method: 'POST',
						url: `${backendURL}/n8n/subscription-webhooks`,
						headers: {
							'Content-Type': 'application/json',
							Accept: 'application/json',
							'auth-token': authToken,
						},
						body: {
							url: webhookUrl,
							webhookFor,
						},
						json: true,
					});

					// ensure we received an id
					if (!response?.id) {
						throw new NodeOperationError(
							this.getNode(),
							'No subscription ID returned from Trendswell API',
						);
					}

					// persist subscription id in workflow static data (node-scoped)
					const staticData = this.getWorkflowStaticData('node') as any;
					staticData.webhookId = response.id;

					return true;
				} catch (error) {
					// NodeApiError expects a JsonObject (not a plain Error)
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
				}
			},

			/**
			 * delete - called when workflow is deactivated
			 */
			async delete(this: IHookFunctions): Promise<boolean> {
				try {
					const staticData = this.getWorkflowStaticData('node') as any;
					const webhookId = staticData?.webhookId;

					if (!webhookId) {
						// nothing to delete
						return true;
					}

					const credentials = (await this.getCredentials('trendswellApi')) as {
						authToken?: string;
					};
					const authToken = credentials?.authToken as string | undefined;

					// perform delete request (your Zapier code uses DELETE /zap/webhooks/:id)
					await this.helpers.request({
						method: 'DELETE',
						url: `${backendURL}/n8n/webhooks/${webhookId}`,
						headers: {
							'Content-Type': 'application/json',
							Accept: 'application/json',
							'auth-token': authToken,
						},
						body: {
							hookUrl: webhookId,
						},
						json: true,
					});

					// remove stored id
					delete staticData.webhookId;

					return true;
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
				}
			},
		},
	};

	/**
	 * webhook runtime function - receives incoming HTTP POSTs from your backend
	 */
	async webhook(this: IWebhookFunctions) {
		const body = this.getBodyData();
		// your backend posts { data: [...] } so unwrap if present
		const data = (body as any)?.data ?? body;

		// if data is an array, return each item as separate node item
		if (Array.isArray(data)) {
			const items = data.map((entry) => ({ json: entry as JsonObject }));
			return {
				workflowData: [items],
			};
		}

		// single object
		return {
			workflowData: [[{ json: data as JsonObject }]],
		};
	}
}
