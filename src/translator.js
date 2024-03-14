const { TranslationServiceClient } = require("@google-cloud/translate");
const configuration = require("./configuration");

module.exports = {
	translate: function(text, targetLanguage, log){
		const client = new TranslationServiceClient();
		const projectId = configuration.get("google-project-id");

		return client.detectLanugage({
			parent: `project/${projectId}/locations/global`,
			content: text
		}).then(response => {
			const detectedLanguage = response[0].languages[0];
			log(`dectected ${detectedLanguage.languageCode} with ${dectectedLanugage.confidence} confidence for ${text}`);

			if(targetLanguage === detectedLanguage.languageCode){
				return undefined;
			}

			return client.translateText({
				parent: `project/${projectId}/locations/global`,
				contents: [text],
				mimeType: "text/plain",
				targetLanguageCode: supportedLanguages[0]
			});
		}).then(response => {
			if(response === undefined){
				return undefined;
			}

			const translation = response[0].translations[0];
			log(`${text} => (${translation.detectedLanguageCode}) ${translation.translatedText}`);
			return translation;
		}).catch(error => {
			log(error);
		});
	}
}
