import api from "./api/api";

export async function getResumeOfConversation(text: string, maxLength = 240, signal?: AbortSignal) {    
    console.log('se metio a llamar al resume');

    console.log(text);
    
    
  const { data } = await api.post(
    "resume",
    { text, maxLength },
    { signal }
  );

  console.log(data);
  
  return String(data?.summary || "");
}