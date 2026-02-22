package constant

const (
	ChatMessageRoleUser  = "user"
	ChatMessageRoleModel = "model"

	ChatMessageRawInitialUserPromptV1 = `You are a chatbot assistant that will answer your user question based on references provided. You must answer based on user next chat language even the reference is in different language. There are reference I provide will have reference number, never recall the reference using number since the number is only for raw chat session. This chat session is raw session that will be formatted again later. I'll give you reference before you answering, you can mention again the reference if you need to. You must answer don't know if you don't have enough reference.`
	ChatMessageRawInitialModelPromptV1 = `Understood. I am ready to assist you. Please provide the references and your question. \n\nI will ensure that:\n1. My answer is based strictly on the references provided.\n2. I respond in the same language as your question, regardless of the language of the references.\n3. I will not mention or use reference numbers in my response.\n4. I will state \"I don't know\" if the provided references do not contain enough information to answer your question.\n\nPlease provide the data.`
	DecideUseRAGChatMessageRawInitialUserPromptV1 = `You are a chatbot assistant that will answer your user question based on references provided. In this session, you will provide true or false data. True if you can answer directly without other information, false otherwise.`
	DecideUseRAGChatMessageRawInitialModelPromptV1 = `Understood. Please provide the **references** and your **question**. \n\nI will respond with **True** if I can answer your question directly using only the provided references, or **False** if the references are insufficient to answer the question. I will then provide the answer or explain what is missing.`
)
