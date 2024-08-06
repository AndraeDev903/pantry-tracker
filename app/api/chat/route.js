import { NextResponse } from 'next/server';
import { LlamaAPI } from 'llamaapi'; // Import the Llama API client

// System prompt for the AI, providing guidelines on how to respond to users
const SYSTEM_PROMPT = "You are a helpful Customer support assistant. Provide concise and accurate responses.";

// POST function to handle incoming requests
export async function POST(req) {
    // Initialize the Llama API client with your API key
    const llamaApiClient = new LlamaAPI('your-api-key-here');

    // Parse the JSON body of the incoming request
    const requestData = await req.json();

    // Prepare the messages array for the Llama API request
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...requestData.messages // Assuming the incoming request has a 'messages' array
    ];

    // Define any functions that the model might call
    const functions = [
        {
            name: "get_order_status",
            description: "Get the current status of a customer's order",
            parameters: {
                type: "object",
                properties: {
                    order_id: {
                        type: "string",
                        description: "The unique identifier for the order",
                    },
                },
            },
            required: ["order_id"],
        },
        {
            name: "initiate_return",
            description: "Start the return process for a customer's order",
            parameters: {
                type: "object",
                properties: {
                    order_id: {
                        type: "string",
                        description: "The unique identifier for the order to be returned",
                    },
                    reason: {
                        type: "string",
                        description: "The reason for the return",
                    },
                },
            },
            required: ["order_id", "reason"],
        },
        {
            name: "check_product_availability",
            description: "Check if a product is in stock",
            parameters: {
                type: "object",
                properties: {
                    product_id: {
                        type: "string",
                        description: "The unique identifier for the product",
                    },
                },
            },
            required: ["product_id"],
        }
    ];

    // Create a request to the Llama API
    const llamaApiRequest = {
        messages: messages,
        functions: functions,
        stream: true, // Enable streaming responses
        function_call: "auto", // Let the model decide when to call functions
    };

    // Create a ReadableStream to handle the streaming response
    const responseStream = new ReadableStream({
        async start(controller) {
            const textEncoder = new TextEncoder();

            try {
                // Make the API call and process the streaming response
                const llamaApiResponse = await llamaApiClient.run(llamaApiRequest);

                // Set up a reader for the streaming response
                const reader = llamaApiResponse.body.getReader();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    // Assuming the API returns chunks of text
                    const chunk = new TextDecoder().decode(value);
                    const encodedChunk = textEncoder.encode(chunk);
                    controller.enqueue(encodedChunk);
                }
            } catch (error) {
                console.error('Error in Llama API streaming:', error);
                controller.error(error);
            } finally {
                controller.close();
            }
        },
    });

    // Return the stream as the response
    return new NextResponse(responseStream);
}