import { api } from 'virtual:stainless-apis-manifest';
import { EXCLUDE_LANGUAGES } from 'virtual:stl-starlight-virtual-module';

export function getDocsLanguages() {
  return api.languages
    .map((language) => language.language)
    .filter((language) => !EXCLUDE_LANGUAGES.includes(language));
}
