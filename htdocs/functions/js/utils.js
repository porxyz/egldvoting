function make_http_request(path,method,timeout,err_callback,success_callback,post_fields,post_type)
{
	let http_req = new XMLHttpRequest();
	http_req.open(method,path,true);

	http_req.timeout = timeout * 1000;

	http_req.onload = function()
	{
		if(http_req.status == 200)
			success_callback(http_req);
		else
			err_callback("bad_http_response",http_req);
	};
	
	http_req.ontimeout = function(){err_callback("timeout_expired",http_req);}
	http_req.onerror = function(){err_callback("internal_error",http_req);}

	if(method == "POST")
	{
		let post_data = "";
	
		if(post_type == "JSON")
		{
			http_req.setRequestHeader("Content-Type", "application/json");
			post_data = JSON.stringify(post_fields);
		}
		else
		{
			http_req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
			for (let key in post_fields)
			{
    				if (post_fields.hasOwnProperty(key))
    					post_data += (encodeURIComponent(key) + "=" + encodeURIComponent(post_fields[key]) + "&");
			}

			post_data = post_data.substring(0, post_data.length - 1);
		}
		
		http_req.send(post_data);
	}
	else
		http_req.send();

	return http_req;
}

function setCookie(name,value,days) 
{
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie += name + "=" + (value || "")  + expires + "; path=/";
}

function format_date_diff(date1,date2)
{
	if(date1.getTime() < date2.getTime())
	{
		return format_date_diff(date2,date1);
	}
	
	let d_diff = new Date(date1.getTime() - date2.getTime());
	
	let result = "";
	
	//years
	let y = d_diff.getUTCFullYear() - 1970;
	if(y == 1)
	{
		result += "one year, "
	}
	
	else if(y > 1)
	{
		result += y;
		result += " years, ";
	}
	
	//months
	let M = d_diff.getUTCMonth();
	if(M == 1)
	{
		result += "one month, "
	}
	
	else if(M > 1)
	{
		result += M;
		result += " months, ";
	}
	
	//days
	let d = d_diff.getUTCDate() - 1;
	if(d == 1)
	{
		result += "one day, "
	}
	
	else if(d > 1)
	{
		result += d;
		result += " days, ";
	}
	
	//hours
	let h = d_diff.getUTCHours();
	if(h == 1)
	{
		result += "one hour, "
	}
	
	else if(h > 1)
	{
		result += h;
		result += " hours, ";
	}
	
	//minutes
	let m = d_diff.getUTCMinutes();
	if(m == 1)
	{
		result += "one minute, "
	}
	
	else if(m > 1)
	{
		result += m;
		result += " minutes, ";
	}
	
	//seconds
	let s = d_diff.getUTCSeconds();
	if(s == 1)
	{
		result += "one second, "
	}
	
	else if(s > 1)
	{
		result += s;
		result += " seconds";
	}
	
	if(result.endsWith(", "))
	{
		result = result.substring(0, result.length - 2);
	}
	
	return result;
}

function getURLparam(name)
{
	let url = window.location.href;
	
	name = name.replace(/[\[\]]/g, '\\$&');
	let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
	
	let results = regex.exec(url);
	if (!results)
	{
		return null;
	}
	
	else if(!results[2])
	{
		return '';
	}
	
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
