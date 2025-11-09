import api from "./api/api";

export async function getResumeOfConversation(text: string, maxLength = 240, signal?: AbortSignal) {    
    
  const { data } = await api.post(
    "resume",
    { text, maxLength },
    { signal }
  );

  console.log('DATA RESUMIDA ##################',data);
  
  return String(data?.summary || "");
}