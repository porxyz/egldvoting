var SC_ADDR = "erd1qqqqqqqqqqqqqpgqju90d2cmvjt5gnrrc2hyfn7hv2nqudw4vlcsyn2v82";

function querySC(sc_addr, sc_func, sc_func_args,success_cback, error_cback)
{
	let api_url = "https://devnet-gateway.elrond.com/vm-values/query";
	let post_args = {scAddress: sc_addr, funcName: sc_func, args: sc_func_args};
	
	let rq = make_http_request(api_url,"POST",15,error_cback,
	function(req) 
	{
		let server_response = null;
		try
		{
			server_response = JSON.parse(req.responseText);
		}
		catch(e)
		{
			error_cback("bad_http_response",req);
			return;
		}
		
		//verify return object integrity
		if(!server_response.hasOwnProperty("code") || !server_response.hasOwnProperty("data") || server_response.code != "successful" || typeof server_response.data != "object"
		  || !server_response.data.hasOwnProperty("data") || typeof server_response.data.data != "object" || !server_response.data.data.hasOwnProperty("returnData")
		  || !Array.isArray(server_response.data.data.returnData))
		{
			error_cback("bad_http_response",req);
			return;
		}
		
		success_cback(server_response.data.data.returnData); 
	}, post_args, "JSON");
	
	return rq;
}

function conv_SC_ret_to_uint(SC_result)
{
	let raw_num = "";
	
	try
	{
		raw_num = atob(SC_result[0]);
	}
	catch(e)
	{
		return false;
	}
	
	if(raw_num.length > 8)
		return false;
		
	//rebuild number in big engian byte order
	let result = 0;
	for(let idx = 0; idx < raw_num.length; idx ++)
	{
		result = result << 8;
		result += raw_num.charCodeAt(idx);
	}
	
	return result;
}


function conv_SC_ret_to_hex_addr(SC_result)
{
	let raw_data = "";
	
	try
	{
		raw_data = atob(SC_result);
	}
	catch(e)
	{
		return false;
	}
	
	
	let result = "";
	for(let idx = 0; idx < raw_data.length; idx ++)
	{
		let hex_digits = raw_data.charCodeAt(idx).toString(16);
		if(hex_digits.length == 2)
		{
			result += hex_digits; 
		}
		else
		{
			result += "0"; 
			result += hex_digits; 
		}
	}
	
	return result;
}

function conv_SC_ret_to_contestant_info(SC_result)
{
	let raw_data = "";
	
	try
	{
		raw_data = atob(SC_result[0]);
	}
	catch(e)
	{
		return false;
	}
	
	
	let result = {name: false, age:false, desc: false, photo_url: false};
	
	//extract name
	if(raw_data.length < 4)
	{
		return false;
	}
	
	//a string with a dword indicating size
	let name_len = 0;
	for(let idx = 0; idx < 4; idx ++)
	{
		name_len = name_len << 8;
		name_len += raw_data.charCodeAt(idx);
	}
	
	let raw_data_offset = 4;
	if(raw_data.length < name_len + raw_data_offset)
	{
		return false;
	}
	
	result.name = raw_data.substr(raw_data_offset, name_len);
	raw_data_offset += name_len;
	
	//extract age, which is a 8 bit number
	result.age = raw_data.charCodeAt(raw_data_offset);
	raw_data_offset++;
	
	//extract the contestant's description
	if(raw_data.length < raw_data_offset + 4)
	{
		return false;
	}
	
	let desc_len = 0;
	for(let idx = 0; idx < 4; idx ++)
	{
		desc_len = desc_len << 8;
		desc_len += raw_data.charCodeAt(idx + raw_data_offset);
	}
	raw_data_offset += 4;
	if(raw_data.length < desc_len + raw_data_offset)
	{
		return false;
	}
	result.desc = raw_data.substr(raw_data_offset, desc_len);
	raw_data_offset += desc_len;
	
	//extract photo url
	if(raw_data.length < raw_data_offset + 4)
	{
		return false;
	}
	
	let url_len = 0;
	for(let idx = 0; idx < 4; idx ++)
	{
		url_len = url_len << 8;
		url_len += raw_data.charCodeAt(idx + raw_data_offset);
	}
	
	raw_data_offset += 4;
	if(raw_data.length < url_len + raw_data_offset)
	{
		return false;
	}
	
	result.photo_url = raw_data.substr(raw_data_offset, url_len);
	
	return result;
}


//wait on https://devnet-gateway.elrond.com/transaction/:tx/status
function check_SC_tx_status(tx, cback)
{
	let api_url = "https://devnet-gateway.elrond.com/transaction/" + tx + "/status";
	
	let rq = make_http_request(api_url,"GET",15,function()
	{
		setTimeout(function(){check_SC_tx_status(tx, cback);}, 1000);
	},
	function(req) 
	{
		let server_response = null;
		try
		{
			server_response = JSON.parse(req.responseText);
		}
		catch(e)
		{
			cback("bad_response");
			return;
		}
		
		if(!server_response.hasOwnProperty("code") || !server_response.hasOwnProperty("data") || server_response.code != "successful" || typeof server_response.data != "object"
		  || !server_response.data.hasOwnProperty("status"))
		{
			cback("bad_response");
			return;
		}
		
		let tx_status = server_response.data.status;
		if(tx_status == "pending")
		{
			setTimeout(function(){check_SC_tx_status(tx, cback);}, 1000);
			return;
		}
		
		cback(tx_status);
	});
	
	return rq;
}

