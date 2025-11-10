import api from "./api/api";

export async function getResumeOfConversation(text: string, maxLength = 240, language = 'en', signal?: AbortSignal) {    

  const { data } = await api.post(
    "resume",
    { text, maxLength, language },
    { signal }
  );
  
  return String(data?.summary || "");
}