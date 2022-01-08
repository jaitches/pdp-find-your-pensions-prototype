const delegateList = require('./delegateList.json')

function createDelList() {
	let delegatesDetails = []
	let faDelegateAddress = "102 Cromwell Road, London, SW18 7YD"
	for (let i=0; i < delegateList.delegates.length; i++) {
		let delegateName = delegateList.delegates[i].split('(')[0]
		let delegateReference = delegateList.delegates[i].split('(')[1].replace(')',' ')
		if (delegateReference.includes('MaPS')) {
			faDelegateAddress = "120 Holborn, "
		}
		else {
			newDelegateReference = delegateReference
		}
		let delegateDetail = {
			"name": delegateName,
			"ref": newDelegateReference }
		delegatesDetails.push(delegateDetail)
//		console.log('delegateReference ' + delegateReference)
	}		
	console.log('delegatesDetails ' + JSON.stringify(delegatesDetails))

}

createDelList()