const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const formatDate = function(inputDate) {
	if (!inputDate) {
		return null
	}
	else {
		let stringDateArr = inputDate.split('-')
		let monthPosition = Number(stringDateArr[1]) -1
		let stringDate = ""
		stringDate = stringDateArr[2] + ' ' + monthNames[monthPosition] + ' ' + stringDateArr[0]

		return stringDate
	}
}
module.exports = formatDate;
