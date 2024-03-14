const { TranslationServiceClient } = require("@google-cloud/translate");

module.exports = {
	translate: function(text, targetLanguage, appConfiguration, log){
		const client = new TranslationServiceClient();
		const projectId = appConfiguration["google_project_id"];

		return client.detectLanguage({
			parent: `projects/${projectId}/locations/global`,
			content: text
		}).then(response => {
			const detectedLanguage = response[0].languages[0];
			log(`detected ${detectedLanguage.languageCode} with ${detectedLanguage.confidence} confidence for ${text}`);

			if(targetLanguage === detectedLanguage.languageCode){
				return undefined;
			}

			return client.translateText({
				parent: `projects/${projectId}/locations/global`,
				contents: [text],
				mimeType: "text/plain",
				targetLanguageCode: targetLanguage
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
