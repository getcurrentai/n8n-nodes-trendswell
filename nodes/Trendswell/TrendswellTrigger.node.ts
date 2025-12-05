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
		icon: 'file:trendswell.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when a Trendswell event occurs',
		defaults: { name: 'Trendswell Trigger' },
		inputs: [],
		outputs: [NodeConnectionType.Main],

		credentials: [
			{
				name: 'trendswellApi',
				required: true,
			},
		],

		// incoming webhook URL for n8n
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'trendswell', // => /webhook/<id>/trendswell
			},
		],

		properties: [
			{
				displayName: 'Webhook For',
				name: 'webhookFor',
				type: 'options',
				options: [
					{ name: 'Trendswell Searches', value: 'trendswell-searches' },
					// future event types here
				],
				default: 'trendswell-searches',
				description: 'The type of event this webhook listens for',
			},
		],
	};

	/**
	 * Webhook Lifecycle Methods
	 */
	webhookMethods = {
		default: {
			/**
			 * 🔍 1. checkExists()
			 * Called when workflow is activated.
			 * n8n checks if the webhook is already registered in your backend.
			 */
			async checkExists(this: IHookFunctions): Promise<boolean> {
				try {
					const staticData = this.getWorkflowStaticData('node') as any;
					const webhookId = staticData?.webhookId;
					if (!webhookId) return false;

					const credentials = await this.getCredentials('trendswellApi');
					const authToken = credentials.authToken as string;

					// Check if webhook still exists in your backend
					await this.helpers.httpRequest({
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
					return false;
				}
			},

			/**
			 * 🟢 2. create()
			 * Called only when workflow is TURNED ON and webhook does NOT already exist.
			 * Registers webhook in your backend.
			 */
			async create(this: IHookFunctions): Promise<boolean> {
				try {
					const credentials = await this.getCredentials('trendswellApi');
					const authToken = credentials.authToken as string;

					if (!authToken) {
						throw new NodeOperationError(
							this.getNode(),
							'Auth token missing in Trendswell credentials',
						);
					}

					// n8n webhook URL that backend should call
					const webhookUrl = this.getNodeWebhookUrl('default');
					const webhookFor = this.getNodeParameter('webhookFor') as string;

					// Register webhook in your backend
					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${backendURL}/n8n/subscription-webhooks`,
						headers: {
							'Content-Type': 'application/json',
							'auth-token': authToken,
						},
						body: {
							url: webhookUrl,
							webhookFor,
						},
						json: true,
					});

					if (!response?.id) {
						throw new NodeOperationError(this.getNode(), 'No webhook ID returned from backend');
					}

					// Store webhook ID in n8n workflow static data
					const staticData = this.getWorkflowStaticData('node') as any;
					staticData.webhookId = response.id;

					return true;
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},

			/**
			 * 🔴 3. delete()
			 * Called when workflow is TURNED OFF.
			 * Removes webhook from your backend.
			 */
			async delete(this: IHookFunctions): Promise<boolean> {
				try {
					const staticData = this.getWorkflowStaticData('node') as any;
					const webhookId = staticData?.webhookId;

					if (!webhookId) return true; // nothing to delete

					const credentials = await this.getCredentials('trendswellApi');
					const authToken = credentials.authToken as string;

					// DELETE webhook in backend
					await this.helpers.httpRequest({
						method: 'DELETE',
						url: `${backendURL}/n8n/webhooks/${webhookId}`,
						headers: {
							'Content-Type': 'application/json',
							'auth-token': authToken,
						},
						json: true,
					});

					// Cleanup stored ID
					delete staticData.webhookId;
					return true;
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
		},
	};

	/**
	 * 🔵 4. webhook() → Receives data from your backend
	 * Backend sends either:
	 *   { data: [...] }
	 *   OR single object
	 */
	async webhook(this: IWebhookFunctions) {
		const body = this.getBodyData();

		// If backend sends { data: [...] }
		const data = (body as any)?.data ?? body;

		// If array → return each as separate item
		if (Array.isArray(data)) {
			return {
				workflowData: [data.map((d) => ({ json: d }))],
			};
		}

		// Single object
		return {
			workflowData: [[{ json: data }]],
		};
	}
}
