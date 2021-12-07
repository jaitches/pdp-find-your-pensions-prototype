const prototypeArray = [
    {number: 1, text: "Find only", urlPath: "01-find-only", startUrl: "01-find-only/01-start", displayUrl: "01-find-only/01-display-pensions"},
    {number: 2, text: "Find and view", urlPath: "02-find-view", startUrl: "02-find-view/02-start", displayUrl: "02-find-view/02-display-pensions"},
    {number: 3, text: "Find and accrued", urlPath: "03-find-accrued", startUrl: "03-find-accrued/03-start", displayUrl: "03-find-accrued/03-display-pensions"},
    {number: 4, text: "Find, accrued and estimated, table", urlPath: "04-find-accrued-estimated", startUrl: "04-find-accrued-estimated/04-start", displayUrl: "04-find-accrued-estimated/04-display-pensions"},
// using prototype 5 with the C&A testing so replacing the paths 
//    {number: 5, text: "Find, accrued and estimated, individual", urlPath: "05-full-alt-display", startUrl: "05-full-alt-display/05-start", displayUrl: "05-full-alt-display/05-display-pensions"}
    {number: 5, text: "Find, accrued and estimated, individual", urlPath: "find-your-pensions", startUrl: "find-your-pensions/index", displayUrl: "find-your-pensions/fyp-display-pensions"}
]    
const getPrototypeDetails = function(ptypeNo) {
        for (let i=0; i < prototypeArray.length; i++) {
            if (prototypeArray[i].number == ptypeNo) {
                return prototypeArray[i]
        }
    }
    console.log('Error: prototype not found in reference data')
}
module.exports = getPrototypeDetails;
