import api from "./api/api";

export type CountryItem = {
  id: string;
  name: string;
  code: string;      
  phoneCode: string; 
  isAvailable: boolean;
};

export type StateItem = {
  id: string;      
  name: string;
  code: string;
  countryId: string;
};

export async function fetchCountries(language: "es"|"en"|"br" = "es") {
  const { data } = await api.get<CountryItem[]>("countries/selector", {
    headers: { language },
  });
  return data;
}

export async function fetchStatesByCountry(countryId: string, language: "es"|"en"|"br" = "es") {
  const { data } = await api.get<StateItem[]>(`states/selector/country/${countryId}`, {
    headers: { language },
  });
  return data;
}
