/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

$(document).ready(function () {
  window.GOVUKFrontend.initAll()
})

function removeProvider() {
	if (confirm('Do you want to remove this pension provider from your list?')) {
	} 
	else {
	   return false;
	}
}

function cancelDelegation() {
	if (confirm('Do you want to cancel giving access to an authorised person?')) {
	} 
	else {
	   return false;
	}
}
