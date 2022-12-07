
function local_check_registering_data_valid()
{
	let registering_period_end = localStorage.getItem("SC_registering_period_end_timestamp");
	let user_registered = localStorage.getItem("user_registered");
	
	if(registering_period_end === null || registering_period_end < ((new Date()).getTime() / 1000) || user_registered == "true")
	{
		return false;
	}
	
	let contestants_list = null;
	try
	{
		contestants_list = JSON.parse(localStorage.getItem("SC_contestants_list"));
	}
	catch(e)
	{
		return true;
	}
	
	return true;
}

function check_user_auth()
{
	let wallet_key = localStorage.getItem("wallet_key");
	if(wallet_key !== null)
	{
		return true;
	}
	
	return false;
}

function animate_loading_text_p()
{
	let loading_text_spans = document.getElementsByClassName("loading_text_animation");
	if(loading_text_spans.length == 0)
	{
		return;
	}
	
	let d_now = (new Date()).getTime() / 1000;
	let dots = (d_now % 5) + 1;
	
	let dot_char = "•";
	let inner_content = dot_char.repeat(dots);
	
	for(let i = 0; i < loading_text_spans.length; i++)
	{
		loading_text_spans[i].innerHTML = inner_content;
	}
	
	setTimeout(animate_loading_text_p,1000);
}


function initiate_payment()
{
	let msg_box = document.getElementById("transaction_process_msg");
	let post_args = {SC: SC_ADDR, pem: localStorage.getItem("wallet_key"), data: getURLparam("data")};
	
	make_http_request("action/register.php","POST",15,function(){msg_box.innerHTML = "Network error. Please try again latter.";},
	function(req) 
	{
		let server_response = null;
		try
		{
			server_response = JSON.parse(req.responseText);
		}
		catch(e)
		{
			msg_box.innerHTML = "Invalid server response. Please try again latter.";
			return;
		}
		
		if(!server_response.hasOwnProperty("tx"))
		{
			msg_box.innerHTML = "Something went wrong. Please try again latter.";
			return;
		}
		
		msg_box.innerHTML = "Transaction ID: <span class='spn_link' onclick=\"window.open('https://devnet-explorer.elrond.com/transactions/" + server_response.tx + "');\">" + server_response.tx + "</span><br/><span class='loading_text_animation'></span>";
		animate_loading_text_p();
		
		check_SC_tx_status(server_response.tx,function(result)
		{
			let response_msg  = "Transaction ID: <span class='spn_link' onclick=\"window.open('https://devnet-explorer.elrond.com/transactions/" + server_response.tx + "');\">" + server_response.tx + "</span><br/>";
			
			if(result == "bad_response")
			{
				response_msg += "<span style='color:red;'>Something went wrong when processing the transaction.</span><br/>";
				response_msg += "<span>Please check on the Blockchain Explorer.</span>";
			}
			else if(result == "fail")
			{
				response_msg += "<span style='color:red;'>The Smart Contract rejected the transaction.</span><br/>";
				response_msg += "<span>Please check on the Blockchain Explorer.</span>";
			}
			else
			{
				response_msg += "<span style='color:green;'>The transaction was completed successfully.</span><br/>";
				response_msg += "<span>Please check on the Blockchain Explorer.</span>";
				
				localStorage.setItem("user_registered","true");
			}
			
			msg_box.innerHTML = response_msg;
		});
		
	}, post_args);
	
}

function page_load()
{
	if(!local_check_registering_data_valid())
	{
		document.getElementById("transaction_process_msg").innerHTML = "There is a issue with the request. <br/> If you think this is a mistake, please try again later.";
	}
	else if(!check_user_auth())
	{
		window.location.href = "wallet_auth.html?redir=" + encodeURIComponent("register_participant.html" + window.location.search);
	}
	else
	{
		document.getElementById("transaction_process_msg").innerHTML = "Please wait to until payment is complete.";
		initiate_payment();
	}
}

window.onload = page_load;
