const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));
    
    const client = new BedrockRuntimeClient({ region: "us-west-2" });
    
    try {
        if (event.httpMethod === "OPTIONS") {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "POST, OPTIONS"
                },
                body: ""
            };
        }
        
        const body = JSON.parse(event.body);
        const { message, context } = body;
        
        if (!message) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "POST, OPTIONS"
                },
                body: JSON.stringify({ error: "Message is required" })
            };
        }
        
        const prompt = `Human: You are an AI assistant for Situ8, a security management platform. 
        
Context: ${context || "General security platform assistance"}
        
User message: ${message}
        
Please provide a helpful response focused on security operations, incident management, or guard activities. Keep responses concise and actionable.
        
Assistant:`;
        
        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: prompt
                }]
            }),
            contentType: "application/json",
            accept: "application/json"
        });
        
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify({
                response: responseBody.content[0].text,
                model: "claude-3-5-sonnet",
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify({
                error: "Internal server error",
                details: error.message
            })
        };
    }
};