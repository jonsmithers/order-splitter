"use strict";var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"])_i["return"]();}finally{if(_d)throw _e;}}return _arr;}return function(arr,i){if(Array.isArray(arr)){return arr;}else if(Symbol.iterator in Object(arr)){return sliceIterator(arr,i);}else{throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}window.onload=init;function init(){document.getElementById("split").addEventListener("click",onSplitButtonClick);document.getElementById("percentageCheckbox").addEventListener("click",onPercentageCheckboxClick);// check for URL query parameters
if(window.location.search){var queryString=window.location.search.substring(1);// remove prefixing '?'
handleOrder(function(){return parseQueryStringInput(queryString);});}loadPreferences();}/**
 * Loads user preferences from localStorage.
 */function loadPreferences(){if(Storage){if(localStorage.getItem('isTipPercentage')==='false'){// tip is a percentage by default, update if user prefs is 'false'
updateTipComponents(false);document.getElementById('percentageCheckbox').checked=false;}}}function onPercentageCheckboxClick(){var isTipPercentage=document.getElementById('percentageCheckbox').checked;updateTipComponents(isTipPercentage);// save user preference to localStorage
if(Storage){localStorage.setItem('isTipPercentage',isTipPercentage);}}/**
 * Updates the tip components according to the tip being a percentage.
 * @param {boolean} isTipPercentage
 */function updateTipComponents(isTipPercentage){document.getElementById('fixedSpan').hidden=isTipPercentage;document.getElementById('percentageSpan').hidden=!isTipPercentage;}function onSplitButtonClick(){var text=document.getElementById('textarea').value;var tax=Number(document.getElementById('taxes').value);var fee=Number(document.getElementById('fees').value);var tip=Number(document.getElementById('tip').value);var isTipPercentage=document.getElementById('percentageCheckbox').checked;handleOrder(function(){return parseOrderUpInput(text,fee,tax,tip,isTipPercentage);});}function handleOrder(parserFunction){try{var order=parserFunction();order.split();display(order);}catch(error){alert(error);console.error(error);}}function display(order){var calculationsTable='<table>'+'<tr><td>Subtotal:</td><td>$'+prettifyNumber(order.subTotal)+'</td><td>(user input; sum of item costs)</td></tr>'+'<tr><td>Tax:</td><td>$'+prettifyNumber(order.tax)+'</td><td>(user input)</td></tr>'+'<tr><td>Fees:</td><td>$'+prettifyNumber(order.fee)+'</td><td>(user input)</td></tr>'+'<tr><td>Tip:</td><td>$'+prettifyNumber(order.tipDollars)+'</td><td>('+(order.isTipPercentage?'tip percent * subtotal':'user input')+')</td></tr>'+'<tr><td>Total:</td><td>$'+prettifyNumber(order.total)+'</td><td>(subtotal + tax + fees + tip)</td></tr>'+'<tr><td>Fees per Person:</td><td>$'+prettifyNumber(order.feesPerPerson)+'</td><td>(fees / number of people)</td></tr>'+'<tr><td>Tax (Percent):</td><td>'+order.taxPercentDisplay+'%</td><td>(tax / subtotal)</td></tr>'+'<tr><td>Tip (Percent):</td><td>'+order.tipPercentDisplay+'%</td><td>('+(order.isTipPercentage?'user input':'tip / subtotal')+')</td></tr>'+'</table>';var html='<hr>'+calculationsTable+'<br>'+makeBreakdownDisplay(order)+'<br>'+'Publish the following:<br>'+'<pre>'+makeTotalsDisplay(order.totals)+'</pre>'+makeHyperlink(order.tax,order.fee,order.tip,order.people);document.getElementById('result').innerHTML=html;}/**
 * Returns a string of a number in the format "#.##"
 * @example
 * prettifyNumber(12); // returns "12.00"
 * @param {number} n - The number to prettify
 * @returns {string} A string of a number rounded and padded to 2 decimal places
 */function prettifyNumber(n){n=Math.round(n*100)/100;// round to 2 decimal places
// pad to 2 decimal places if necessary
var s=n.toString();if(s.indexOf('.')===-1){s+='.';}while(s.length<s.indexOf('.')+3){s+='0';}return s;}/**
 * Returns a listing of names to split costs
 * @param {object} totals - The totals property from the Order
 * @returns {string} A view mapping names to split costs
 */function makeTotalsDisplay(totals){// get length of longest name
var longestName=-1;var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=totals[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var _step$value=_slicedToArray(_step.value,2),person=_step$value[0],price=_step$value[1];longestName=Math.max(person.length,longestName);}// add 1 to longest name for a space after name
}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}longestName+=1;var output='';var name;var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=totals[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){var _step2$value=_slicedToArray(_step2.value,2),_person=_step2$value[0],_price=_step2$value[1];var _name=_person;for(var i=_person.length;i<longestName;i++){_name+=' ';}output+=_name+'$'+prettifyNumber(_price)+'<br>';}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}return output;}/**
 * Returns a hyperlink to this split order.
 * @param {number} tax - amount of taxes
 * @param {fee} fee - amount of fees
 * @param {number} tip - tip
 * @param {Object} personItemCosts - map of person name to item costs
 * @return {string} The hyperlink to this order
 */function makeHyperlink(tax,fee,tip,personItemCosts){var link=window.location.origin+window.location.pathname;if(link.indexOf('index.html')===-1){link+='index.html';}if(tip!==0)tip=prettifyNumber(tip);link+='?tax='+tax+'&fee='+fee+'&tip='+tip;var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=personItemCosts[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){var _step3$value=_slicedToArray(_step3.value,2),person=_step3$value[0],val=_step3$value[1];link+='&'+encodeURIComponent(person)+'='+prettifyNumber(val);}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}return'<a href='+link+'>'+link+'</a>';}/**
 * Returns a display breaking down the Order split calculations
 * @param {Order} order - the Order to breakdown
 * @returns {string} A view of the Order breakdown
 */function makeBreakdownDisplay(order){var breakdown='<table id="breakdown">';breakdown+='<tr><th>Person</th><th>Item Costs</th><th>Tax</th><th>Tip</th><th>Fees Per Person</th><th>Person Total</th></tr>';var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=order.people[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){var _step4$value=_slicedToArray(_step4.value,2),person=_step4$value[0],price=_step4$value[1];breakdown+='<tr><td>'+person+'</td><td>'+price+'</td><td> + '+// item costs
price+' * '+order.taxPercent+'</td><td> + '+// taxes
price+' * '+order.tipPercent+'</td><td> + '+// tip
order.feesPerPerson+'</td><td> = '+prettifyNumber(order.totals.get(person))+'</td></tr>';}}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}breakdown+='</table>';return breakdown;};var Order=function(){function Order(){_classCallCheck(this,Order);this.people=new Map();this.tip=0;this.tax=0;this.nonTaxedFees=0;this.taxedFees=0;this.isTipPercentage=false;}_createClass(Order,[{key:"withTip",value:function withTip(tip){var asPercentage=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;this.isTipPercentage=asPercentage;if(this.isTipPercentage){this._tipPercentage=tip/100;}else{this._tipDollars=tip;}return this;}},{key:"withNonTaxedFees",value:function withNonTaxedFees(){for(var _len=arguments.length,fees=Array(_len),_key=0;_key<_len;_key++){fees[_key]=arguments[_key];}this.nonTaxedFees=fees.reduce(function(acc,val){return acc+val;});return this;}},{key:"withTaxedFees",value:function withTaxedFees(){for(var _len2=arguments.length,fees=Array(_len2),_key2=0;_key2<_len2;_key2++){fees[_key2]=arguments[_key2];}this.taxedFees=fees.reduce(function(acc,val){return acc+val;});return this;}},{key:"withTax",value:function withTax(tax){this.tax=tax;return this;}},{key:"withPerson",value:function withPerson(name,price){var newPrice=price;if(this.people.has(name)){newPrice+=this.people.get(name);}this.people.set(name,newPrice);return this;}},{key:"split",value:function split(){var totals=new Map();this.subTotal=0;var _iteratorNormalCompletion5=true;var _didIteratorError5=false;var _iteratorError5=undefined;try{for(var _iterator5=this.people.entries()[Symbol.iterator](),_step5;!(_iteratorNormalCompletion5=(_step5=_iterator5.next()).done);_iteratorNormalCompletion5=true){var _step5$value=_slicedToArray(_step5.value,2),name=_step5$value[0],price=_step5$value[1];this.subTotal+=price;}}catch(err){_didIteratorError5=true;_iteratorError5=err;}finally{try{if(!_iteratorNormalCompletion5&&_iterator5.return){_iterator5.return();}}finally{if(_didIteratorError5){throw _iteratorError5;}}}this.subTotal+=this.taxedFees;var _iteratorNormalCompletion6=true;var _didIteratorError6=false;var _iteratorError6=undefined;try{for(var _iterator6=this.people.entries()[Symbol.iterator](),_step6;!(_iteratorNormalCompletion6=(_step6=_iterator6.next()).done);_iteratorNormalCompletion6=true){var _step6$value=_slicedToArray(_step6.value,2),name=_step6$value[0],price=_step6$value[1];var totalForPerson=price;totalForPerson+=price*this.taxPercent;totalForPerson+=price*this.tipPercent;totalForPerson+=this.feesPerPerson;totals.set(name,totalForPerson);}}catch(err){_didIteratorError6=true;_iteratorError6=err;}finally{try{if(!_iteratorNormalCompletion6&&_iterator6.return){_iterator6.return();}}finally{if(_didIteratorError6){throw _iteratorError6;}}}this.totals=totals;var totalPrice=Array.from(totals.values()).reduce(function(acc,val){return acc+val;});if(Math.round(totalPrice*100)!=Math.round(this.total*100)){throw new Error("Everyone's share does not add up to total");}return this;}},{key:"taxPercent",get:function get(){return this.tax/this.subTotal;}},{key:"taxPercentDisplay",get:function get(){return this.taxPercent*100;}},{key:"fee",get:function get(){return this.nonTaxedFees;}},{key:"tipPercent",get:function get(){if(this.isTipPercentage){return this._tipPercentage;}return this._tipDollars/this.subTotal;}},{key:"tipPercentDisplay",get:function get(){return this.tipPercent*100;}},{key:"tipDollars",get:function get(){return this.tipPercent*this.subTotal;}},{key:"feesPerPerson",get:function get(){return this.fee/this.people.size;}},{key:"total",get:function get(){return this.subTotal+this.fee+this.tipDollars+this.tax;}}]);return Order;}();;/**
 * Parses input from a URL query string into an Order.
 * @example
 * parseQueryStringInput('tax=0.30&fee=1.50&tip=1.25&Gus=5.00');
 * @param {string} queryString - The URL query string
 * @returns {Order} An order parsed from the URL query string
 */function parseQueryStringInput(queryString){var pairs=queryString.split('&');var order=new Order();for(var i=0;i<pairs.length;i++){var pairValues=pairs[i].split('=');pairValues[1]=Number(pairValues[1]);if(pairValues[0]==='fee'){order.withNonTaxedFees(pairValues[1]);}else if(pairValues[0]==='tax'){order.withTax(pairValues[1]);}else if(pairValues[0]==='tip'){order.withTip(pairValues[1]);}else{order.withPerson(decodeURIComponent(pairValues[0]),pairValues[1]);}}return order;}/**
 * Parses the confirmation summary from an OrderUp.com order
 * @param {string} orderUpText - The confirmation summary from OrderUp.com
 * @param {number} fee
 * @param {number} tax
 * @param {number} tip - The tip (either a fixed value or percentage)
 * @param {boolean} isTipPercentage - True if the tip is a percentage as opposed to a fixed value
 * @return {Order} An order parsed from the OrderUp.com confirmation summary
 */function parseOrderUpInput(orderUpText,fee,tax,tip,isTipPercentage){// TODO: check if the number at the beginning of the line affects the item cost
// example: 2 Chicken $4.00
//   should the cost for the person be $4 or $8?
var order=new Order().withNonTaxedFees(fee).withTax(tax).withTip(tip,isTipPercentage);var label='Label for:';var itemCost=null;var array=orderUpText.split('\n');for(var i=0;i<array.length;i++){var line=array[i].trim();line=line.replace(/\s+/g,' ');// replace all whitespace with single space
if(!itemCost){var dollarIndex=line.lastIndexOf('$');if(dollarIndex>-1){itemCost=Number(line.substring(dollarIndex+1,line.length));}continue;}var labelIndex=line.indexOf(label);if(labelIndex>-1){var name=line.substring(labelIndex+label.length,line.length);order.withPerson(name,itemCost);itemCost=null;}}return order;};(function(){if(location.hostname==='localhost'){console.log('service worker disabled on localhost');return;}if(!('serviceWorker'in navigator)){console.log('service worker not supported');return;}navigator.serviceWorker.register('./sw.js').then(function(registration){// Registration was successful 😊
console.log('ServiceWorker registration successful with scope: ',registration.scope);}).catch(function(err){// registration failed :(
console.log('ServiceWorker registration failed: ',err);});})();