exports.config = {
	host: process.env.SELENIUM_REMOTE_HOST,
	specs: ['./tests.js'],
	capabilities: [
		{ browserName: 'chrome' },
		{ browserName: 'firefox' }
	],
	baseUrl: process.env.BAG_CUPID_URL,
	framework: 'mocha',
	before: (capabilities, specs) => {
		let chai = require('chai');
		global.expect = chai.expect;
		chai.Should();
	}
};
