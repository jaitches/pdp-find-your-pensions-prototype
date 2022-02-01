const express = require('express')
const router = express.Router()
const fs = require('fs')
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb')
const uri = 'mongodb+srv://' + process.env.MONGODB_URI + '?ssl=true&retryWrites=true&w=majority'
const dataBaseName = process.env.PENSIONS_DB
const formatDate = require('./formatDate.js')
const getPrototypeDetails = require('./getPrototypeDetails.js')
const countryListJson = require('./countryList.json')
const providerListDirectedFind = require('./providerListDirectedFind.json')
const delegateList = require('./delegateList.json')

// Use these arrays to store the options for the select element when updating the pensions
// also populates the session variables for descriptions
const penTypes = [
    {type: "DC", text: "Defined Contribution pension", selected : "", 
    moneyHelperURL : 'https://www.moneyhelper.org.uk/en/pensions-and-retirement/pensions-basics/defined-contribution-pension-schemes',
    description: 'This is a type of pension where the amount you get when you retire depends on how much you and your employer put in and how much this money grows.' ,
    descriptionPrivate: 'This is a type of pension where the amount you get when you retire depends on how much you put in and how much this money grows.'},
    {type: "DB", text: "Defined Benefit pension", selected : "", description: "A defined benefit pension scheme is one where the amount you’re paid is based on how many years you’ve worked for your employer and the salary you’ve earned.",
    moneyHelperURL : 'hhttps://www.moneyhelper.org.uk/en/pensions-and-retirement/pensions-basics/defined-benefit-or-final-salary-pensions-schemes-explained',
    },
    {type: "ST", text: "State Pension", selected : "", description : "A regular payment from government that you qualify for when you reach State Pension age. The amount you get depends on your National Insurance record."},
    {type: "AVC", text: "AVC pension", selected : ""},
    {type: "HYB", text: "Hybrid pension", selected : ""}
]
const penOrigin = [
    {type: "W", text: "Workplace", selected : ""},
    {type: "P", text: "Private", selected : ""},
    {type: "S", text: "State", selected : ""}
]
const penStatus = [
    {type: "A", text: "Active", selected : ""},
    {type: "I", text: "Inactive", selected : ""}
]
const penAccAmtType = [
    {type: "N/A", text: "N/A", selected : ""},
    {type: "POT", text: "Valuation of a DC pension pot", selected : ""},
    {type: "INC", text: "Calculation of an accrued recurring income", selected : ""},
    {type: "LS", text: "Calculation of the accrued value of DBLS/CDCLS type", selected : ""}
]
const penEriOrAccrType = [
    {type: "N/A", text: "N/A", selected : ""},
    {type: "DC", text: "Defined contribution", selected : ""},              
    {type: "DB", text: "Defined benefit", selected : ""},           
    {type: "DBL", text: "A separately accrued lump sum (not commutation)", selected : ""},              
    {type: "AVC", text: "Additional voluntary contribution", selected : ""},              
    {type: "CDI", text: "Collective DC (CC) benefits expressed as regular income", selected : ""},           
    {type: "CDL", text: "Collective DC (CC) benefits expressed as lump sum", selected : ""},              
    {type: "CBS", text: "Cash balance scheme", selected : ""}
]
const penHowEriCalc = [
    {type: "N/A", text: "N/A", selected : ""},
    {type: "SMPI", text: "SMPI - statutory money purchase illustration", selected : ""},              
    {type: "COBS", text: "COBS - Income illustration FCA COBS rules", selected : ""},             
    {type: "BS", text: "BS - Benefit specific method no allowance of future build-up of benefits", selected : ""},              
    {type: "BSF", text: "BSF - Benefit specific method including future build-up of benefits", selected : ""}
]
const penAccrAmtType = [
    {type: "N/A",text: "N/A", selected : ""},
    {type: "POT", text: "Valuation of a DC pension pot", selected : ""},              
    {type: "INC",text: "Calculation of an accrued recurring income", selected : ""},              
    {type: "LS", text: "Calculation of the accrued value of DBLS/CDCLS type", selected : ""}
]

//
// ****** routes for main pages and prototypes
//

// display which participant and database is being used
router.get('/', function (req,res) {
    req.app.locals.participantNumber = process.env.PARTICIPANT_NUMBER
    if (process.env.PENSIONS_DB == "pdp-test") {
        req.app.locals.pensionsDatabase = "Test"
    }
    else if (process.env.PENSIONS_DB == "pensions") {
        req.app.locals.pensionsDatabase = "Live prototype"
    }
    res.render('index')
})


router.post('/prototype-or-admin', function (req, res) {

    const whichPage = req.session.data['which-start']
    switch (whichPage) {        
        case "consumer-prototype":
            res.redirect('/find-your-pensions/fyp-index')
            break        
        case "delegate-prototype":
            res.redirect('/delegates/start')
            break
        case "admin":
            res.redirect('/admin/manage-pensions')
            break   
        }
})

//
// MoneyHelper dashboard pages
//

// dashboard consents page 
router.post('/fyp-consents', function(req,res) {
    // copy checked status from checkboxes
    let dashboardConsentStore = req.session.data['consent-to-store']
    let dashboardConsentUse = req.session.data['consent-to-use']
    //    req.app.locals.checkedStore = dashboardConsentStore
    //    req.app.locals.checkedUse = dashboardConsentUse

    // set the error fields if not all the consents are checked

    if (dashboardConsentUse == null) {
        req.app.locals.dashboardConsentErrorString = "To find your pensions you must agree to this consent"
        req.app.locals.errorFormClass = "govuk-form-group--error"  
        req.app.locals.errorInputClass = "govuk-input--error" 
//        req.app.locals.checkedUse = "" 
        res.render('find-your-pensions/fyp-consents')
    } 
    else {
        req.app.locals.dashboardConsentErrorString = ""
        req.app.locals.errorFormClass = ""
        req.app.locals.errorInputClass = ""
//        req.app.locals.checkedUse = "checked"
        res.redirect('/c-and-a/redirect-identity')
    }
})

//
// identity pages
//

//
// Pension Finder - consent and authorisation pages
//

// main menu 
router.post('/consents-menu', function (req,res) {
    const consentMenu = req.session.data['consent-menu']
    switch (consentMenu) {
        case "find":
            res.redirect('c-and-a/find/find-all-or-directed')
            break      
        case "delegation":
            res.redirect('c-and-a/delegation/start')
            break        
        case "manage-consents":
            res.redirect('c-and-a/consents/manage-consents')
            break
    }
})

// route for managing consent for individual dashboard providers
// rewrite this to display the dashboards to manage
router.get('/c-and-a/consents/individual-consents', function (req, res) {
    async function findPensionsByOwner() {
    let participantNumber = process.env.PARTICIPANT_NUMBER
    console.log('getIndividualConsent') 
    req.app.locals.dashboard = req.query.dashboard 
    

        const client = new MongoClient(uri)
        try {
            // Connect to the MongoDB cluster
            await client.connect()

                pensionDetailsAll = await getAllPensions(client, participantNumber)
                req.app.locals.pensionIdentifiers=pensionDetailsAll
            
            }            

             
        finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.render('./c-and-a/consents/individual-consents')
        }
    }
    findPensionsByOwner () .catch(console.error)  
   

   
    async function getAllPensions(client, pptNumber) {
        const results = await client.db(dataBaseName).collection("pensionDetails")
        // find all documents
        .find({pensionOwnerType: "M", pensionParticipant :  pptNumber})
        // save them to an array
        .sort({pensionName: 1})        
        .toArray()
        console.log('results ' + JSON.stringify(results))
        return results
    }

}) 

// consents page Pension Finder
 
router.post('/consents-all', function (req, res) {

    // copy checked status from checkboxes

    const consent1 = req.session.data['consents-1']


// set the error fields if not all the consents are checked
    if (consent1 == null) {

        req.app.locals.consentsErrorString = "To find your pensions you must agree to this consent"
        req.app.locals.errorFormClass = "govuk-form-group--error"  
        req.app.locals.errorInputClass = "govuk-input--error" 
        res.render('c-and-a/find/search')
    } 
    else {
        req.app.locals.consentsErrorString = ""
        req.app.locals.errorFormClass = ""
        req.app.locals.errorInputClass = ""
        res.redirect('find-your-pensions/fyp-display-pensions')
    }

})
//
// directed find
//

// directed find menu

router.post('/find-all-or-directed', function (req, res) {
    req.app.locals.directedFind = false
    req.app.locals.directedOrAll = "all UK pension providers"
    res.redirect('c-and-a/find/search')
})

// directed find search

router.get('/c-and-a/find/directed-find', function (req, res) {
    req.app.locals.providerSearchValue = ""
    req.app.locals.searchListNames = []
    req.app.locals.directedFind = true
    req.app.locals.firstPageLoad = true
    req.app.locals.directedListNames =[]
    req.app.locals.directedOrAll = "the pension providers you have selected"
    req.app.locals.listStarted = false
    req.app.locals.directedListNames =[]
    res.render('c-and-a/find/directed-find')
})

router.post('/search-for-provider', function (req, res) {
    // filter function

    req.app.locals.firstPageLoad = false
    let providerSearchValue = req.session.data['provider-search-value']
    req.app.locals.providerSearchValue = providerSearchValue
  //error if no value entered
    if (providerSearchValue == "") {
        req.app.locals.errorString = "Field is blank - Enter a pension provider name"
        req.app.locals.errorFormClass = "govuk-form-group--error"  
        req.app.locals.errorInputClass = "govuk-input--error" 
        res.render('c-and-a/find/directed-find')
    }
    else {
        req.app.locals.errorString = ""
        req.app.locals.errorFormClass = ""
        req.app.locals.errorInputClass = "" 

        // if more than one term entered make them both required to narrow down the search

        if (providerSearchValue !== null) {

        // do a filtered search on the json

            searchResults= filterItems( providerListDirectedFind, providerSearchValue)
            req.app.locals.searchListNames = searchResults

            if (searchResults.length > 1) {
                req.app.locals.pensionProviderPlural = 'pension providers'
            }
            else {
                req.app.locals.pensionProviderPlural = 'pension provider'
            }
        }
        res.render('c-and-a/find/directed-find')
    }
    function filterItems(arr, query) {
      return arr.filter(function(el) {
        return el.toLowerCase().indexOf(query.toLowerCase()) !== -1
      })
    }

})

// directed find add to list

router.post('/add-provider-to-list', function (req, res) {
    req.app.locals.listStarted = true
    let selectedProviders =[]
    selectedProviders = req.session.data['provider-list']

    if (selectedProviders) {
        let providerList = req.app.locals.directedListNames
        for (i=0; i < selectedProviders.length; i++) {
            providerList.push(selectedProviders[i])
        }
        req.app.locals.directedListNames = providerList
    }
    res.render('c-and-a/find/directed-find')

})

// directed find remove provider from list

router.post('/remove-provider/:providerName', function (req, res) {
    for (i=0 ; i<req.app.locals.directedListNames.length; i++ ) {
        if (req.app.locals.directedListNames[i] == req.params.providerName)
            req.app.locals.directedListNames.splice([i],1)
    }
    res.render('c-and-a/find/directed-find')


})

// enter details for Find

router.post('/enter-your-details', function (req, res) {
    // initialise variables
    req.app.locals.emailAddress = ""
    req.app.locals.address = ""
    req.app.locals.niNumber = ""
    req.app.locals.telNumber = ""  
//    req.app.locals.lastName = ""
//    req.app.locals.firstName = ""
    req.app.locals.altName = ""
    req.app.locals.prevAddress = ""

    let altName = req.session.data['alt-name']

    let emailAddress = req.session.data['email']
    let telNumber = req.session.data['telephone-number']
    let niNumber = req.session.data['ni-number']

    let address1 = req.session.data['prev-address-line-1']
    let address2 = req.session.data['prev-address-line-2']
    let town = req.session.data['prev-address-town']
    let county = req.session.data['prev-address-county']
    let postcode = req.session.data['prev-address-postcode']
    let prevAddress = address1 + ', ' + address2 + ', ' + town + ', ' + county + ', ' + postcode
    console.log('req.session.data[prev-address-line-1] ' + req.session.data['prev-address-line-1'])
    console.log('adress1 ' + address1)
    console.log('prevAddress ' + prevAddress)


    req.app.locals.prevAddress = prevAddress
    req.app.locals.emailAddress = emailAddress
    req.app.locals.niNumber = niNumber
    req.app.locals.telNumber = telNumber  
    req.app.locals.altName = altName

    req.app.locals.firstName = 'Jane'
    req.app.locals.lastName = 'Smith'
    req.app.locals.dob = '01 APR 1982'
    req.app.locals.address = '42 High Street, Reading, Berks, RG1 4WD'

    res.redirect('/c-and-a/find/find-all-or-directed')


})

//
// Delegation pages
//

// delegation start - set first page load flag so error not displayed on first visit

router.get('/c-and-a/delegation/select-delegate', function (req, res) {
    req.app.locals.delegateFirstPageLoad = true
    req.app.locals.delegateSearchValue = ""
    req.app.locals.searchListDelegates = []
    res.render('c-and-a/delegation/select-delegate')

})

// search for delegate
router.post('/search-delegate', function (req, res) {
    // filter function

    req.app.locals.delegateFirstPageLoad = false
    let delegateSearchValue = req.session.data['delegate-search-value']
    req.app.locals.delegateSearchValue = delegateSearchValue
  //error if no value entered
    if (delegateSearchValue == "") {
        req.app.locals.delegateErrorString = "Field is blank - Enter a name or reference number"
        req.app.locals.errorFormClass = "govuk-form-group--error"  
        req.app.locals.errorInputClass = "govuk-input--error" 
    }
    else {
        req.app.locals.delegateErrorString = ""
        req.app.locals.errorFormClass = ""
        req.app.locals.errorInputClass = "" 

        if (delegateSearchValue !== null) {

        // do a filtered search on the json

            searchResults = filterItems( delegateList, delegateSearchValue)
            req.app.locals.searchListDelegates = searchResults
        }
    }
    res.render('c-and-a/delegation/select-delegate')

    function filterItems(arr, query) {
        return arr.filter(function(el) {
        return el.toLowerCase().indexOf(query.toLowerCase()) !== -1
      })
    }

})

// select the person to delegate access to

router.post('/select-delegate', function (req, res) {
    let selectedDelegate = req.session.data['delegate-list']
    req.app.locals.delegateName = selectedDelegate.split('(')[0]
        if (selectedDelegate.includes('MaPS')) {
        req.app.locals.delegateAddress = ""
        req.app.locals.delegateOrganisation = "Money and Pensions Service"
    }
    else {
        req.app.locals.delegateAddress = "102 Cromwell Road, London, SW18 7YD"
        req.app.locals.delegateOrganisation = req.app.locals.delegateName.split(' '[1]) + "Associates"
    }

    res.redirect('c-and-a/delegation/delegate-duration')
})

// get dates to display on duration page
router.get('/c-and-a/delegation/delegate-duration', function (req, res) {

    let today_date = new Date()
    let dateTomorrow = new Date()
    let dateWeek = new Date()
    let dateMonth = new Date()
    let dateThreeMonths = new Date()

    // work out the dates to display
    dateTomorrow.setDate(today_date.getDate() + 1)
    dateWeek.setDate(today_date.getDate() + 7)
    dateMonth.setMonth(today_date.getMonth() + 1)
    dateThreeMonths.setMonth(today_date.getMonth() + 3)

    req.app.locals.dateTomorrow = formatDelegateDate(dateTomorrow)
    req.app.locals.dateWeek = formatDelegateDate(dateWeek)
    req.app.locals.dateMonth = formatDelegateDate(dateMonth)
    req.app.locals.dateThreeMonths = formatDelegateDate(dateThreeMonths)

    res.render('c-and-a/delegation/delegate-duration')

    // reformat the date to make them like govuk
    function formatDelegateDate(date) {
        console.log('date ' + date)
        let dateArr = date.toDateString().split(' ')
        let formattedDate = dateArr[2] + ' ' + dateArr[1] + ' ' + dateArr[3]
        return formattedDate
    } 
})

// delegate duration
router.post('/delegate-duration', function (req, res) {
    let delegateDuration = req.session.data['duration']

    req.app.locals.delegateDurationDate = delegateDuration.substr(0,delegateDuration.indexOf('-'))
    req.app.locals.delegateDuration = delegateDuration.substr(delegateDuration.indexOf('-') +1)
    res.redirect('c-and-a/delegation/confirmation')
})

// delegation consent on confirmation page
 
router.post('/delegation-consent', function (req, res) {

    // copy checked status from checkboxes

    const delConsent = req.session.data['delegation-consent-1']
    console.log('delConsent ' + delConsent)

// set the error fields if the consent is not checked
    if (delConsent == null) {

        req.app.locals.delegateConsentsErrorString = "You must agree to this consent to allow an authorised person access to view your pensions "
        req.app.locals.errorFormClass = "govuk-form-group--error"  
        req.app.locals.errorInputClass = "govuk-input--error" 
        res.render('c-and-a/delegation/confirmation')
    } 
    else {
        req.app.locals.delegateConsentsErrorString = ""
        req.app.locals.errorFormClass = ""
        req.app.locals.errorInputClass = ""
        res.redirect('find-your-pensions/fyp-display-pensions')
    }

})

//
// Find your pensions / MoneyHelper pages
//

router.get('/find-your-pensions/fyp-display-pensions', function (req, res) {
    async function findPensionsByParticipant() {

        let participantNumber = process.env.PARTICIPANT_NUMBER

        let pensionDetailsAll = []
        // set the local variables to false so that the elements are not displayed in the html unless they exist
        req.app.locals.stateFlag = false

        // initialise the arrays
        req.app.locals.allPensionTypes = []
        req.app.locals.statePensionDetails = []

        let employmentStartDateString = ""
        let employmentEndDateString = ""
        let accruedCalculationDateString = ""
        let ERICalculationDateString = ""
        let pensionRetirementDateString = ""


        const client = new MongoClient(uri)
        try {
            // Connect to the MongoDB cluster
            await client.connect()

            pensionDetailsAll = await getAllPensions(client, participantNumber)
              
            // split into state and other pensions

            for (i=0; i < pensionDetailsAll.length; i++) {
            // convert dates to string and display as dd mon yyyy
            console.log('id ' + pensionDetailsAll[i]._id)
                let employmentStartDateString = ""
                let employmentEndDateString = ""
                let accruedCalculationDateString = ""
                let ERICalculationDateString = ""
                let pensionRetirementDateString = ""

                // Flag to display message
                req.app.locals.NIPaidUP = false

                if (pensionDetailsAll[i].accruedAmount == pensionDetailsAll[i].ERIAnnualAmount) {
                    req.app.locals.NIPaidUP = true
                }

                // use include "-" to see if a date has been entered in the field, not null doesn't work
                if (pensionDetailsAll[i].pensionRetirementDate.includes("-")) {
                    pensionRetirementDateString = await formatDate(pensionDetailsAll[i].pensionRetirementDate)
                }
                /*
                if (pensionDetailsAll[i].ERICalculationDate.includes("-")) {
                    ERICalculationDateString = await formatDate(pensionDetailsAll[i].ERICalculationDate)
                }
                */

                if (pensionDetailsAll[i].accruedCalculationDate.includes("-")) {
                    accruedCalculationDateString = await formatDate(pensionDetailsAll[i].accruedCalculationDate)
                }
//                console.log('pensionDetailsAll[i].accruedCalculationDate ' + pensionDetailsAll[i].accruedCalculationDate + ' ' + pensionDetailsAll[i].pensionName)                
//                console.log('accruedCalculationDateString ' + accruedCalculationDateString)                
                if (pensionDetailsAll[i].employmentStartDate.includes("-")) {
                    employmentStartDateString = await formatDate(pensionDetailsAll[i].employmentStartDate)
                }
                if (pensionDetailsAll[i].employmentEndDate.includes("-")) {                    
                    employmentEndDateString = await formatDate(pensionDetailsAll[i].employmentEndDate)
                }
            // copy the date strings values to the array to display on the prototype
                pensionDetailsAll[i].pensionRetirementDateString = pensionRetirementDateString
                pensionDetailsAll[i].ERICalculationDateString = ERICalculationDateString
                pensionDetailsAll[i].accruedCalculationDateString = accruedCalculationDateString
                pensionDetailsAll[i].employmentStartDateString = employmentStartDateString
                pensionDetailsAll[i].employmentEndDateString = employmentEndDateString
            // convert the values to sterling
            // convert values to monthly for prototype 5
                let ERIAnnualAmountSterling = ""
                let accruedAmountSterling = ""
                let ERIPotSterling = ""
                let monthlyAccruedAmount = pensionDetailsAll[i].accruedAmount / 12
                let monthlyERIAnnualAmount = pensionDetailsAll[i].ERIAnnualAmount / 12

                ERIAnnualAmountSterling = Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(monthlyERIAnnualAmount)              
                if (pensionDetailsAll[i].pensionType == "DC") {                 
                    accruedAmountSterling = Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pensionDetailsAll[i].accruedAmount)
                }
                else {
                    accruedAmountSterling = Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(monthlyAccruedAmount)
                }                                 
            
                ERIPotSterling = Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pensionDetailsAll[i].ERIPot)           

            // copy the sterling values to the array to display on the prototype

                pensionDetailsAll[i].ERIAnnualAmountSterling = ERIAnnualAmountSterling
                pensionDetailsAll[i].ERIPotSterling = ERIPotSterling
                pensionDetailsAll[i].accruedAmountSterling = accruedAmountSterling

                // set the status to display the still saving status
                if (pensionDetailsAll[i].pensionStatus == "I") {
                    pensionDetailsAll[i].pensionStatusYN = "No"
                }
                else {
                    pensionDetailsAll[i].pensionStatusYN = "Yes"
                }
                // find pension type text
                for (j=0; j < penTypes.length; j++) {
                    if (pensionDetailsAll[i].pensionType == penTypes[j].type) {
                        pensionDetailsAll[i].penTypeDescription = penTypes[j].text
                    }
                } 
                // split pensions in to state pension and others
                if (pensionDetailsAll[i].pensionOrigin !== "S") {
                    req.app.locals.pensionsFoundFlag = true
                    req.app.locals.allPensionTypes.push(pensionDetailsAll[i])
                }
                else if (pensionDetailsAll[i].pensionOrigin == "S") {
                    req.app.locals.stateFlag = true
                    // there will only be one record for State Pension!
                    req.app.locals.statePensionDetails = pensionDetailsAll[i]
                }                
            }
        } 
        finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.render('find-your-pensions/fyp-display-pensions')
        }
    }

    findPensionsByParticipant().catch(console.error)
   
    async function getAllPensions(client, pptNumber) {
        // pensionOwnerType = "M"  only includes manually entered pensions and not examples
        // return all pensions if participant = 0 

        if (pptNumber == "0") {
            const results = await client.db(dataBaseName).collection("pensionDetails")
            .find({pensionOwnerType: "M"})
            // save them to an array and sort by newest first
            .sort({pensionStartDate: -1, pensionName: 1})        
            .toArray()
            return results

        }
        // return pensions for the selected participant
        else {
            const results = await client.db(dataBaseName).collection("pensionDetails")
            // find all documents
            .find({pensionOwnerType: "M", pensionParticipant :  pptNumber})
            // save them to an array and sort by newest first
            .sort({pensionStartDate: -1, pensionName: 1})        
            .toArray()
            return results
        }
    }

}) 


// more details page

router.get('/find-your-pensions/fyp-single-pension-details*', function (req, res) {

    async function findPensionDetails() {

        req.app.locals.pensionDetails = []
        req.app.locals.pensionProvider = []

        let pensionId = req.query.pensionId
        let providerId = req.query.providerId
        let pensionType = req.query.pensionType

        let employmentStartDateString = ""
        let pensionStartDateString = ""
        let employmentEndDateString = ""
        let ERICalculationDateString = ""  
        let accruedCalculationDateString = ""
        let pensionRetirementDateString =""

        // get the values from the session variables
        console.log('pensionType ' + pensionType)
        if (pensionType == "ST") {
            req.app.locals.pensionDetails = req.app.locals.statePensionDetails
        }
        else {
            for (i=0; i < req.app.locals.allPensionTypes.length; i++) {
                if (req.app.locals.allPensionTypes[i]._id == pensionId) {
                    req.app.locals.pensionDetails = req.app.locals.allPensionTypes [i]
                }  
            }          
        }
        console.log('pensionDetails ' + JSON.stringify(req.app.locals.pensionDetails))


        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
//            req.app.locals.pensionDetails = await getPensionById(client, pensionId)
            req.app.locals.pensionProvider = await getProviderById(client, providerId)
            // if paid all NI set string to not display message in details page
/*            if (req.app.locals.pensionDetails.accruedAmount !== req.app.locals.pensionDetails.ERIAnnualAmount) {
                req.app.locals.NINotPaidUP = true
            }
            */
            if (req.app.locals.pensionProvider.administratorURL) {
                req.app.locals.pensionProvider.administratorShortURL = req.app.locals.pensionProvider.administratorURL.replace(/^https?\:\/\//i, "")
            }
            if (req.app.locals.pensionProvider.administratorAnnualReportURL) {
                req.app.locals.pensionProvider.administratorAnnualReportShortURL = req.app.locals.pensionProvider.administratorAnnualReportURL.replace(/^https?\:\/\//i, "")
            }
            if (req.app.locals.pensionProvider.administratorCostsChargesURL) {
                req.app.locals.pensionProvider.administratorCostsChargesShortURL = req.app.locals.pensionProvider.administratorCostsChargesURL.replace(/^https?\:\/\//i, "")
            }
            if (req.app.locals.pensionProvider.administratorImplementationURL) {
                req.app.locals.pensionProvider.administratorImplementationShortURL = req.app.locals.pensionProvider.administratorImplementationURL.replace(/^https?\:\/\//i, "")
            }
            if (req.app.locals.pensionProvider.administratorSIPURL) {  
                req.app.locals.pensionProvider.administratorSIPShortURL = req.app.locals.pensionProvider.administratorSIPURL.replace(/^https?\:\/\//i, "")
            }
            if (req.app.locals.pensionDetails.pensionStartDate.includes("-")) {
                pensionStartDateString = await formatDate(req.app.locals.pensionDetails.pensionStartDate)
            }             
            req.app.locals.pensionDetails.pensionStartDateString = pensionStartDateString

            for (i=0; i < penTypes.length; i++) {
                if (req.app.locals.pensionDetails.pensionType == penTypes[i].type) {
                    console.log('req.app.locals.pensionDetails.pensionType ' + req.app.locals.pensionDetails.pensionType)
                    req.app.locals.pensionDetails.pensionTypeName = penTypes[i].text
                    if (req.app.locals.pensionDetails.pensionOrigin == "P") {
                        req.app.locals.pensionDetails.pensionTypeDescription = penTypes[i].descriptionPrivate
                        req.app.locals.pensionDetails.moneyHelperURL =  penTypes[i].moneyHelperURL
                    }
                    else {
                        req.app.locals.pensionDetails.pensionTypeDescription = penTypes[i].description
                        req.app.locals.pensionDetails.moneyHelperURL =  penTypes[i].moneyHelperURL

                    }
                }
            } 
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('find-your-pensions/fyp-single-pension-details')
        }
    }

    findPensionDetails().catch(console.error)

    // get the pension details
    async function getPensionById(client, pensionId) {
        const results = await client.db(dataBaseName).collection("pensionDetails")
        .findOne({ _id : ObjectId(pensionId)})
//        console.log('results getPensionById' + JSON.stringify(results))
        return results
    }
    // get the provider details
    async function getProviderById(client, providerId) {
        const results = await client.db(dataBaseName).collection("pensionProvider")
        // find all documents
        .findOne({ _id : ObjectId(providerId)})
        return results
    }
})



//
// ****** routes for pension management *******
//

// choose what data to add or update
router.post('/manage-pensions', function (req, res) {
    const whatDataToManage = req.session.data['what-do-you-want-to-do']
    switch (whatDataToManage) {
        case "add-pension":
            res.redirect('/admin/add-pension')
            break;
        case "pensions-list":
            res.redirect('/admin/pensions-list')
            break;       
        case "add-provider":
            res.redirect('/admin/add-provider')
            break;             
        case "providers-list":
            res.redirect('/admin/providers-list')
            break;     
        default:
            res.render('/admin/manage-pensions')
    }
})

// Display pensions
router.get('/admin/pensions-list', function (req, res) {
    let participantNumber = process.env.PARTICIPANT_NUMBER

// connect to MongoDB to add the doc (record) to the collection (table)

    async function findAllPensions() {
        const client = new MongoClient(uri)

        try {
            // Connect to the MongoDB cluster
            await client.connect()
            let allPensionDetails = await getAllPensions(client)
            let manualPensionDetails = []
            let examplePensionDetails = []

            // create two arrays one for the manually entered pensions for the selected partiipant and one for the examples

            for (i=0; i < allPensionDetails.length; i++){
                if (allPensionDetails[i].pensionOwnerType == "M" && participantNumber == 0) {
                                        manualPensionDetails.push(allPensionDetails[i])
                }
                else if (allPensionDetails[i].pensionOwnerType == "M" && allPensionDetails[i].pensionParticipant == participantNumber) {
                    manualPensionDetails.push(allPensionDetails[i])
                }
                else if (allPensionDetails[i].pensionOwnerType == "E") {
                    examplePensionDetails.push(allPensionDetails[i])
                }
            }
            req.app.locals.manualPensionDetails = manualPensionDetails
            req.app.locals.examplePensionDetails = examplePensionDetails
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('admin/pensions-list')
        }
    }

    findAllPensions().catch(console.error);

    async function getAllPensions(client) {
        const results = await client.db(dataBaseName).collection("pensionDetails")
        // find all documents
        .find({})
        // save them to an array
        .sort({pensionOwner: 1, accruedType: 1})        
        .toArray()
        return results
    }
})

router.get('/admin/add-pension', function (req, res) {
    // get the pension provider list to display in the select provider field
    req.app.locals.pensionProviders = []
    async function findPensionProviders() {        
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProviders = await getProviders(client)
            console.log('pensionProviders ' + req.app.locals.pensionProviders)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('admin/add-pension')
        }
    }

    findPensionProviders().catch(console.error);

    async function getProviders(client) {
        const results = await client.db(dataBaseName).collection("pensionProvider")
        // find all documents
        .find({})
        // save them to an array
        .sort({administratorName: 1})        
        .toArray()

//        console.log('results providers' + JSON.stringify(results))
        return results
    }

})

router.post('/add-pension-details', function (req, res) {

// format date
    let today_timestamp = new Date().toLocaleString()
    // get the inputted pension data 

    let pension_Participant = process.env.PARTICIPANT_NUMBER

    let pension_Start_Date = new Date()
    let pension_Retirement_Date = new Date()
    let employment_Start_Date = new Date()
    let employment_End_Date = new Date()
    let ERI_Calculation_Date = new Date()
    let ERI_Payable_Date = new Date()
    let accrued_Payable_Date = new Date()
//set type to manual added - M (not default - D)
    let pension_Owner_Type = "M"
    let pension_Owner = req.session.data['pensionOwner']
    let pension_Description = req.session.data['pensionDescription']
    let pension_Reference = req.session.data['pensionReference']
    let pension_Name = req.session.data['pensionName']
    let pension_Type = req.session.data['pensionType']
    let pension_Origin = req.session.data['pensionOrigin']
    let pension_Status = req.session.data['pensionStatus']
    pension_Start_Date = req.session.data['pensionStartDate']
    pension_Retirement_Date = req.session.data['pensionRetirementDate']
    let pension_Retirement_Age = req.session.data['pensionRetirementAge']
    let pension_Link = ""

// the administratorDetails passed from the form includes the administrator _id and the name
    let administrator = req.session.data['administratorDetails']
    let administratorArray = administrator.split(":")
    let administrator_Reference = administratorArray [0]
    let administrator_Name = administratorArray [1]

    let employer_Name = req.session.data['employerName']
    employment_Start_Date = req.session.data['employmentStartDate']
    employment_End_Date = req.session.data['employmentEndDate']
    let ERI_Type = req.session.data['ERIType']
    let ERI_Basis = req.session.data['ERIBasis']
    ERI_Calculation_Date = req.session.data['ERICalculationDate'] 
    ERI_Payable_Date = pension_Retirement_Date
    let ERI_Annual_Amount = req.session.data['ERIAnnualAmount']
    let ERI_Pot = req.session.data['ERIPot']
    let ERI_Safeguarded_Benefits = 0
    let ERI_Unavailable = null
    
    let accrued_Type = req.session.data['accruedType']
    let accrued_Amount_Type = req.session.data['accruedAmountType']
    accrued_Calculation_Date = req.session.data['accruedCalculationDate'] 
    accrued_Payable_Date = pension_Retirement_Date
    let accrued_Amount = req.session.data['accruedAmount']
    let accrued_Safeguarded_Benefits = 0
    let accrued_Unavailable = null

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addPension() {
    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Make the appropriate DB calls
            await createPension(client, {

                pensionParticipant : pension_Participant,
                pensionOwnerType : pension_Owner_Type,
                pensionOwner : pension_Owner,
                pensionDescription: pension_Description,
                pensionReference : pension_Reference,
                pensionName : pension_Name,
                pensionType : pension_Type,
                pensionOrigin : pension_Origin,
                pensionStatus : pension_Status,
                pensionStartDate : pension_Start_Date,
                pensionRetirementDate : pension_Retirement_Date,
                pensionRetirementAge : pension_Retirement_Age,
                pensionLink : pension_Link,
                administratorReference : administrator_Reference,
                administratorName : administrator_Name,
                employerName : employer_Name,
                employmentStartDate : employment_Start_Date,
                employmentEndDate : employment_End_Date,
                ERIType : ERI_Type,
                ERIBasis : ERI_Basis,
                ERICalculationDate : ERI_Calculation_Date,
                ERIPayableDate : ERI_Payable_Date,
                ERIAnnualAmount : ERI_Annual_Amount,
                ERIPot : ERI_Pot,
                ERISafeguardedBenefits : ERI_Safeguarded_Benefits,
                ERIUnavailable : ERI_Unavailable,
                accruedType : accrued_Type,
                accruedAmountType : accrued_Amount_Type,
                accruedCalculationDate : accrued_Calculation_Date,
                accruedPayableDate : accrued_Payable_Date,
                accruedAmount : accrued_Amount,
                accruedSafeguardedBenefits : accrued_Safeguarded_Benefits,
                accruedUnavailable : accrued_Unavailable,
                timeStamp: today_timestamp

            })
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect('/admin/add-pension')
        }
    }

    addPension().catch(console.error);

    // Add functions that make DB calls here
    async function createPension(client, newPension){
        const result = await client.db(dataBaseName).collection("pensionDetails").insertOne(newPension);
        console.log(`New Pension created with the following id: ${result.insertedId}`)
    } 

})

router.get('/admin/update-pension*', function (req, res) {
    // find the pension providers for the select options
    async function findAndDisplayPension() { 

        let pensionId = req.query.pensionId
        let providerId = req.query.providerId
        // initialise variables - I have no idea how the selected values are being updated in the const that are copied into the seesion variables
    
        for (i=0; i < penTypes.length; i++) {
            penTypes[i].selected = ""
        }
        for (i=0; i < penOrigin.length; i++) {
            penOrigin[i].selected = ""
        }
        for (i=0; i < penStatus.length; i++) {
            penStatus[i].selected = ""
        }
        for (i=0; i < penEriOrAccrType.length; i++) {
            penEriOrAccrType[i].selected = ""
        }
        for (i=0; i < penAccrAmtType.length; i++) {
            penAccrAmtType[i].selected = ""
        }

        req.app.locals.pensionProviders = []
        req.app.locals.pensionDetails = []

        req.app.locals.pensionId = req.query.pensionId

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProviders = await getProviders(client)
            req.app.locals.pensionDetails = await getPensionById(client, pensionId, providerId)
            // reset selected in penTypes 


        // *** for the HTML select component -  set the selected option to the value in document in MongoDB 

            // Pension type set the selected option

            req.app.locals.pensionDetails.pensionTypeArr = penTypes

            for (i=0; i < req.app.locals.pensionDetails.pensionTypeArr.length; i++) {
                if (req.app.locals.pensionDetails.pensionType == req.app.locals.pensionDetails.pensionTypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionTypeArr[i].selected = 'selected'
                }
            }
            // Pension origin set the selected option
            req.app.locals.pensionDetails.pensionOriginArr = penOrigin
            for (i=0; i < req.app.locals.pensionDetails.pensionOriginArr.length; i++) {
                if (req.app.locals.pensionDetails.pensionOrigin == req.app.locals.pensionDetails.pensionOriginArr[i].type) {
                 req.app.locals.pensionDetails.pensionOriginArr[i].selected = 'selected'   
                }
            }

            // Pension status set the selected option
            req.app.locals.pensionDetails.pensionStatusArr = penStatus
            for (i=0; i < req.app.locals.pensionDetails.pensionStatusArr.length; i++) {
                if (req.app.locals.pensionDetails.pensionStatus == req.app.locals.pensionDetails.pensionStatusArr[i].type) {
                 req.app.locals.pensionDetails.pensionStatusArr[i].selected = 'selected'   
                }
            }
            
            // Pension ERI type set the selected option
            req.app.locals.pensionDetails.pensionERITypeArr = penEriOrAccrType
            for (i=0; i < req.app.locals.pensionDetails.pensionERITypeArr.length; i++) {
                if (req.app.locals.pensionDetails.ERIType == req.app.locals.pensionDetails.pensionERITypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionERITypeArr[i].selected = 'selected'   

                }
            }            

            // Pension how ERI calculated - Basis
            req.app.locals.pensionDetails.pensionERIBasis = penHowEriCalc
            for (i=0; i < req.app.locals.pensionDetails.pensionERIBasis.length; i++) {
               if (req.app.locals.pensionDetails.ERIBasis == req.app.locals.pensionDetails.pensionERIBasis[i].type) {
                    req.app.locals.pensionDetails.pensionERIBasis[i].selected = 'selected'   
                }
            }

            // Pension accrued type set the selected option
            req.app.locals.pensionDetails.pensionAccruedTypeArr = penEriOrAccrType
            for (i=0; i < req.app.locals.pensionDetails.pensionAccruedTypeArr.length; i++) {
                if (req.app.locals.pensionDetails.accruedType == req.app.locals.pensionDetails.pensionAccruedTypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionAccruedTypeArr[i].selected = 'selected'   
                }
            }  

            // Pension accrued amount type set the selected option
            req.app.locals.pensionDetails.pensionAccruedAmtTypeArr = penAccrAmtType
            for (i=0; i < req.app.locals.pensionDetails.pensionAccruedAmtTypeArr.length; i++) {
                if (req.app.locals.pensionDetails.accruedAmountType == req.app.locals.pensionDetails.pensionAccruedAmtTypeArr[i].type) {
                 req.app.locals.pensionDetails.pensionAccruedAmtTypeArr[i].selected = 'selected'   
                }
            }

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close() 
            res.render('admin/update-pension')
        }
    }

    findAndDisplayPension().catch(console.error);

    async function getProviders(client) {
        const results = await client.db(dataBaseName).collection("pensionProvider")
        // find all documents
        .find({})
        // save them to an array
        .sort({administratorName: 1})        
        .toArray()

//        console.log('results providers' + JSON.stringify(results))
        return results
    }

    async function getPensionById(client, pensionId, providerId) {
        const results = await client.db(dataBaseName).collection("pensionDetails")
        // find all documents
        .findOne({_id: ObjectId(pensionId)})

//        console.log('results ' + JSON.stringify(results))
//        console.log('req.app.locals.pensionProviders.length ' + req.app.locals.pensionProviders.length)
        // if the provider is in the query string, the page has been called from add provider so select the new provider not the one on the database
        for (i=0; i < req.app.locals.pensionProviders.length; i++) {
//            console.log('req.app.locals.pensionProviders[i].administratorName ' + req.app.locals.pensionProviders[i].administratorName)
//            console.log('results.administratorName ' + results.administratorName)
        // where the select option is used to display fields, find the correct option from the mongo document and mark it as the selected option
            // mark the administrator name as selected 

            if (results.administratorName == req.app.locals.pensionProviders[i].administratorName) {
//                console.log('selected ' + results.administratorName)
                req.app.locals.pensionProviders[i].selected = 'selected'
            }
            else {
                req.app.locals.pensionProviders[i].selected = ""
            }
        
        }
        return results
    }


})

router.post('/update-pension-details', function (req, res) {    

    async function updatePension() {
    // create an instance of the client
        const client = new MongoClient(uri)

        let pensionId = req.app.locals.pensionId
        let pension_Participant = process.env.PARTICIPANT_NUMBER

       
        // format date
        let today_timestamp = new Date().toLocaleString()

        // make the date variables have a date format
        let pension_Start_Date = new Date()
        let pension_Retirement_Date = new Date()
        let employment_Start_Date = new Date()
        let employment_End_Date = new Date()
        let ERI_Calculation_Date = new Date()
        let ERI_Payable_Date = new Date()
        let accrued_Payable_Date = new Date()

        // get the inputted pension data 

        let pension_Owner = req.session.data['pensionOwner']
        let pension_Description = req.session.data['pensionDescription']
        let pension_Reference = req.session.data['pensionReference']
        let pension_Name = req.session.data['pensionName']
        let pension_Type = req.session.data['pensionType']
        let pension_Origin = req.session.data['pensionOrigin']
        let pension_Status = req.session.data['pensionStatus']
        pension_Start_Date = req.session.data['pensionStartDate']
        pension_Retirement_Date = req.session.data['pensionRetirementDate']
        let pension_Retirement_Age = req.session.data['pensionRetirementAge']
 
        let pension_Link = req.session.data['pensionLink']

        let administrator = req.session.data['administratorDetails']
        let administratorArray = administrator.split(":")
        let administrator_Reference = administratorArray [0]
        let administrator_Name = administratorArray [1]

        let employer_Name = req.session.data['employerName']   
        employment_Start_Date = req.session.data['employmentStartDate']
        employment_End_Date = req.session.data['employmentEndDate']

        let ERI_Type = req.session.data['ERIType']
        let ERI_Basis = req.session.data['ERIBasis']
        ERI_Calculation_Date = req.session.data['ERICalculationDate'] 
        ERI_Payable_Date = pension_Retirement_Date
        let ERI_Annual_Amount = req.session.data['ERIAnnualAmount']
        let ERI_Pot = req.session.data['ERIPot']
        let ERI_Safeguarded_Benefits = 0
        let ERI_Unavailable = null

        let accrued_Type = req.session.data['accruedType']
        let accrued_Amount_Type = req.session.data['accruedAmountType']

        accrued_Calculation_Date = req.session.data['accruedCalculationDate'] 
        accrued_Payable_Date = pension_Retirement_Date
        let accrued_Amount = req.session.data['accruedAmount']
        let accrued_Safeguarded_Benefits = 0
        let accrued_Unavailable = null

        try {
            await client.connect();

            await updatePensionDetails(client, pensionId, {

                pensionParticipant : pension_Participant,
                pensionOwner : pension_Owner,
                pensionDescription: pension_Description,
                pensionReference : pension_Reference,
                pensionName : pension_Name,
                pensionType : pension_Type,
                pensionOrigin : pension_Origin,
                pensionStatus : pension_Status,
                pensionStartDate : pension_Start_Date,
                pensionRetirementAge : pension_Retirement_Age,
                pensionRetirementDate : pension_Retirement_Date,
                pensionLink : pension_Link,
                administratorReference : administrator_Reference,
                administratorName : administrator_Name,
                employerName : employer_Name,
                employmentStartDate : employment_Start_Date,
                employmentEndDate : employment_End_Date,
                ERIType : ERI_Type,
                ERIBasis : ERI_Basis,
                ERICalculationDate : ERI_Calculation_Date,
                ERIPayableDate : ERI_Payable_Date,
                ERIAnnualAmount : ERI_Annual_Amount,
                ERIPot : ERI_Pot,
                ERISafeguardedBenefits : ERI_Safeguarded_Benefits,
                ERIUnavailable : ERI_Unavailable,
                accruedType : accrued_Type,
                accruedAmountType : accrued_Amount_Type,
                accruedCalculationDate : accrued_Calculation_Date,
                accruedPayableDate : accrued_Payable_Date,
                accruedAmount : accrued_Amount,
                accruedSafeguardedBenefits : accrued_Safeguarded_Benefits,
                accruedUnavailable : accrued_Unavailable,
                timeStamp : today_timestamp

            })
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect('/admin/pensions-list')
        }
    }

    updatePension().catch(console.error);

    // Add functions that make DB calls here
    async function updatePensionDetails(client, pensionId, updatePension){
        const result = await client.db(dataBaseName).collection("pensionDetails")
            .updateOne({ _id : ObjectId(pensionId)}, {$set: updatePension});
        console.log(`${result.modifiedCount} document was updated. New Pension created with the following id: ${result.updatedId}`)
    }

})

// the delete button from the list of pensions

router.post('/delete-pension/:id', function (req, res) {

    async function deletePension() {
        
        const client = new MongoClient(uri)

        try {
            await client.connect()
            await deletePensionWithId(client, req.params.id)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('/admin/pensions-list')   
        }
    }
    deletePension().catch(console.error)

    async function deletePensionWithId(client, pensionId) {
        const result = await client.db(dataBaseName).collection("pensionDetails")
            .deleteOne({_id: ObjectId(pensionId)});
        console.log(`${result.deletedCount} document(s) was/were deleted.`)
    }

})

// the delete button from the list of pensions

router.post('/delete-all-pensions', function (req, res) {

    async function deleteAllPension() {
        
        const client = new MongoClient(uri)

        try {
            await client.connect()
            await deletePensions(client, req.params.id)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('admin/pensions-list')   
        }
    }
    deleteAllPension().catch(console.error)

    async function deletePensions(client, pensionId) {
        const result = await client.db(dataBaseName).collection("pensionDetails")
            .deleteMany({pensionOwnerType: "M"});
        console.log(`${result.deletedCount} document(s) was/were deleted.`)
    }

})

router.post('/copy-pension/:id', function (req, res) {

    async function copyPension() {
        
        const client = new MongoClient(uri)
        let examplePensionDetail = {}
        let today_timestamp = new Date().toLocaleString()


        try {
            // Connect to the MongoDB cluster
            await client.connect()
            // get the details of the pension to copy
            examplePensionDetail = await getPensionById(client, req.params.id)

            await createPension(client, {

                pensionOwnerType : "M",
                pensionOwner : examplePensionDetail.pensionOwner,
                pensionReference : examplePensionDetail.pensionReference,
                pensionName : examplePensionDetail.pensionName,
                pensionType : examplePensionDetail.pensionType,
                pensionOrigin : examplePensionDetail.pensionOrigin,
                pensionStatus : examplePensionDetail.pensionStatus,
                pensionStartDate : examplePensionDetail.pensionStartDate,
                pensionRetirementDate : examplePensionDetail.pensionRetirementDate,
                pensionLink : examplePensionDetail.pensionLink,
                administratorReference : examplePensionDetail.administratorReference,
                administratorName : examplePensionDetail.administratorName,
                employerName : examplePensionDetail.employerName,
                employmentStartDate : examplePensionDetail.employmentStartDate,
                employmentEndDate : examplePensionDetail.employmentEndDate,
                ERIType : examplePensionDetail.ERIType,
                ERIBasis : examplePensionDetail.ERIBasis,
                ERICalculationDate : examplePensionDetail.ERICalculationDate,
                ERIPayableDate : examplePensionDetail.ERIPayableDate,
                ERIAnnualAmount : examplePensionDetail.ERIAnnualAmount,
                ERIPot : examplePensionDetail.ERIPot,
                ERISafeguardedBenefits : examplePensionDetail.ERISafeguardedBenefits,
                ERIUnavailable : examplePensionDetail.ERIUnavailable,
                accruedType : examplePensionDetail.accruedType,
                accruedAmountType : examplePensionDetail.accruedAmountType,
                accruedCalculationDate : examplePensionDetail.accruedCalculationDate,
                accruedPayableDate : examplePensionDetail.accruedPayableDate,
                accruedAmount : examplePensionDetail.accruedAmount,
                accruedSafeguardedBenefits : examplePensionDetail.accruedSafeguardedBenefits,
                accruedUnavailable : examplePensionDetail.accruedUnavailable,
                timeStamp: today_timestamp

            })
            // create the new record

        } finally {
            // find the _id of the document just created
            let newPensionDocument = await client.db(dataBaseName).collection("pensionDetails").findOne({ timeStamp : today_timestamp});
            let newPensionId = newPensionDocument._id
            console.log('newPensionDocument ' + JSON.stringify(newPensionDocument))
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('/admin/update-pension?pensionId=' + newPensionId)   
        }
    }
    copyPension().catch(console.error)

    async function getPensionById(client, pensionId) {
        const results = await client.db(dataBaseName).collection("pensionDetails")
        // find all documents
        .findOne({_id: ObjectId(pensionId)})
        return results
    }
    async function createPension(client, newPension){
        const result = await client.db(dataBaseName).collection("pensionDetails").insertOne(newPension);
        console.log(`New Pension created with the following id: ${result.insertedId}`)
    } 
})
//
// ****** routes for providers
//

// Display providers
router.get('/providers-list', function (req, res) {
// connect to MongoDB to add the doc (record) to the collection (table)
    async function findAllProviders() {

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.providersDetails = await getAllProviders(client);
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close();    
            res.render('admin/providers-list')
        }
    }

    findAllProviders().catch(console.error);

    async function getAllProviders(client) {
        const results = await client.db(dataBaseName).collection("pensionProvider")
        // find all documents
        .find({})
        // save them to an array
        .sort({administratorName: 1})        
        .toArray()

        return results
    }
})

router.post('/add-provider-details', function (req, res) {
//get the pension provider list
// format date
    let today_timestamp = new Date().toLocaleString()

    let administrator_Name = req.session.data['administrator-name']
    let administrator_URL = "https://" + administrator_Name.toLowerCase().replace(/ /g,"") + ".co.uk"
    let administrator_Email = "info@" + administrator_Name.toLowerCase().replace(/ /g,"") + ".co.uk"
    let administrator_Phone_Number = "01234 020500"
    let administrator_Annual_Report_URL = administrator_URL + "/annual-report"
    let administrator_Costs_Charges_URL = administrator_URL + "/costs-and-charges"
    let administrator_Implementation_URL = administrator_URL  + "/implementation-statement"
    let administrator_SIP_URL = administrator_URL + "/statement-of-investment.co.uk"

// connect to MongoDB to add the doc (record) to the collection (table)
    async function addProvider() {

    // create an instance of the client
        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            await createProvider(client, {

                administratorName : administrator_Name,
                administratorContactPreference : "Website",
                administratorURL : administrator_URL,
                administratorEmail : administrator_Email,
                administratorPhoneNumber : administrator_Phone_Number,
                administratorPhoneNumberType: "Enquiries",
                administratorPostalName : administrator_Name,
                administratorAddressLine1 : "Floor 21",        
                administratorAddressLine2 : "Palmerston Tower",
                administratorAddressLine3 : "High Street",
                administratorAddressLine4 : "Avontown", 
                administratorAddressLine5 : "",
                administratorPostcode : "AV7 5DS",
                administratorAnnualReportURL : administrator_Annual_Report_URL,
                administratorCostsChargesURL : administrator_Costs_Charges_URL,
                administratorImplementationURL : administrator_Implementation_URL,
                administratorSIPURL : administrator_SIP_URL,
                timeStamp: today_timestamp
            });
        } finally {
            // Close the connection to the MongoDB cluster
            let newProviderDocument = await client.db(dataBaseName).collection("pensionProvider").findOne({ timeStamp : today_timestamp});
            await client.close()

            res.redirect('./admin/update-provider?providerId=' + newProviderDocument._id)
        }
    }

    addProvider().catch(console.error);

    async function getProvider(client, providerName) {
        const results = await client.db(dataBaseName).collection("pensionProvider")
       .findOne({administratorName: providerName})
        return results
    }

    async function createProvider(client, newPension){
        const result = await client.db(dataBaseName).collection("pensionProvider").insertOne(newPension);
        console.log(`New provider created with the following id: ${result.insertedId} New provider created with the following id: ${result.insertedId}`);
    } 

})

router.get('/update-provider', function (req, res) {
    // find the pension providers for the select options
    async function findAndDisplayProviders() { 
        let providerId = req.query.providerId
        req.app.locals.providerDetail = []
        req.app.locals.providerId = req.query.providerId
        console.log('req.app.locals.providerId ' + req.app.locals.providerId)

        const client = new MongoClient(uri);

        try {
            // Connect to the MongoDB cluster
            await client.connect();
            req.app.locals.pensionProvider = await getProvider(client, providerId)

        } finally {
            // Close the connection to the MongoDB cluster
            await client.close() 
            res.render('admin/update-provider')
        }
    }

    findAndDisplayProviders().catch(console.error);

    async function getProvider(client, providerId) {
        const results = await client.db(dataBaseName).collection("pensionProvider")
        // find all documents
       .findOne({_id: ObjectId(providerId)})
        return results
    }

})

router.post('/update-provider-details', function (req, res) {    

    let providerId = req.app.locals.providerId
    
    // format date
    let today_timestamp = new Date().toLocaleString();

    let administrator_Name = req.session.data['administratorName']
    let administrator_Contact_Preference = req.session.data['administratorContactPreference']
    let administrator_URL = req.session.data['administratorURL']
    let administrator_Email = req.session.data['administratorEmail']
    let administrator_Phone_Number = req.session.data['administratorPhoneNumber']
    let administrator_Phone_Number_Type = req.session.data['administratorPhoneNumberType']
    let administrator_Address_Line_1 = req.session.data['administratorAddressLine1']
    let administrator_Address_Line_2 = req.session.data['administratorAddressLine2']
    let administrator_Address_Line_3 = req.session.data['administratorAddressLine3']
    let administrator_Address_Line_4 = req.session.data['administratorAddressLine4']
    let administrator_Address_Line_5 = req.session.data['administratorAddressLine5']
    let administrator_Postcode = req.session.data['administrator_Postcode']
    let administrator_Annual_Report_URL = req.session.data['administratorAnnualReportURL']
    let administrator_Costs_Charges_URL = req.session.data['administratorCostsChargesURL']
    let administrator_Implementation_URL = req.session.data['administratorImplementationURL']
    let administrator_SIP_URL = req.session.data['administratorSIPURL']

    async function updateProvider() {

        const client = new MongoClient(uri)
        try {
            await client.connect()

            await updateProviderDetails(client, providerId, {

                administratorName : administrator_Name,
                administratorContactPreference : administrator_Contact_Preference,
                administratorURL : administrator_URL,
                administratorEmail : administrator_Email,
                administratorPhoneNumber : administrator_Phone_Number,
                administratorPhoneNumberType: administrator_Phone_Number_Type,
                administratorPostalName : administrator_Name,
                administratorAddressLine1 : administrator_Address_Line_1,        
                administratorAddressLine2 : administrator_Address_Line_2,
                administratorAddressLine3 : administrator_Address_Line_3,
                administratorAddressLine4 : administrator_Address_Line_4, 
                administratorAddressLine5 : administrator_Address_Line_5,
                administratorPostcode : administrator_Postcode,
                administratorAnnualReportURL : administrator_Annual_Report_URL,
                administratorCostsChargesURL : administrator_Costs_Charges_URL,
                administratorImplementationURL : administrator_Implementation_URL,
                administratorSIPURL : administrator_SIP_URL,
                timeStamp: today_timestamp

            })
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect('./admin/providers-list')
        }
    }

    updateProvider().catch(console.error);

    async function updateProviderDetails(client, providerId, updateProvider){
        const result = await client.db(dataBaseName).collection("pensionProvider")
            .updateOne({ _id : ObjectId(providerId)}, {$set: updateProvider})
        console.log(`${result.modifiedCount} document was updated. New Provider created with the following id: ${result.insertedId}`)
    }

})

router.post('/delete-provider/:id', function (req, res) {

    async function deleteProvider() {
        
        const client = new MongoClient(uri)

        try {
            await client.connect()
            await deleteProviderById(client, req.params.id)
        } finally {
            // Close the connection to the MongoDB cluster
            await client.close()
            res.redirect ('./admin/providers-list')   
        }
    }
    deleteProvider().catch(console.error)

    async function deleteProviderById(client, providerId) {
        const result = await client.db(dataBaseName).collection("pensionProvider")
            .deleteOne({_id: ObjectId(providerId)})
        console.log(`${result.deletedCount} document(s) was/were deleted.`)
    }

})

module.exports = router
