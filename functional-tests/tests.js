describe('bag cupid index page', () => {
	it('should have correct title', () => {
		browser.url('/');
		browser.getTitle().should.be.equal('Bag Cupid');
	});
});
