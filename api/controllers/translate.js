if (process.env.NODE_ENV !== 'production')
	process.env = require('dotenv-safe').load().parsed

const LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
const language_translator = new LanguageTranslatorV2({
	username: process.env.TRANSLATE_USER,
	password: process.env.TRANSLATE_PSWD,
	url: 'https://gateway.watsonplatform.net/language-translator/api/',
	version: 'v2'
});

exports.translate = function(req, res) {
	const data = req.body
	language_translator.translate({
		text: data.text,
		source: data.source,
		target: data.target
	},
	(err, translation) => {
		if (err) {
			console.log('Error:', err)
			res.json({error : err})
		} else {
			console.log(JSON.stringify(translation, null, 2))
			res.json(translation.translations[0].translation)
		}
	});
}
