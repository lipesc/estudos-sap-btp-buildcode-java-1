/**
 * This custom logic handles the deduction of the redemption amount from the customer's total reward points and updates their total redeemed points.
 * @On(event = { "UPDATE" }, entity = "estudos_buildcode_java_1_cdsSrv.Redemptions")
 * @param {cds.Request} request - User information, tenant-specific CDS model, headers and query parameters
 * @param {Function} next - Callback function to the next handler
*/
module.exports = async function(request, next) {
	// Your code here
	return next();
}