

function open_auth_dial()
{
	 document.getElementById('wallet_key_input').click();
}

function handle_wallet_key_upload()
{
	let input_field = document.getElementById('wallet_key_input');
	let pem_file = input_field.files[0];
	let error_box = document.getElementById("wallet_auth_form_err_msg");
	
	//size too big
	if(pem_file.size > 10000)
	{
		error_box.innerHTML = "The input PEM file is invalid.";
		return;
	}
	
	const reader = new FileReader();
	reader.addEventListener("load", () => 
	{
		let post_args = {pem: reader.result};
		make_http_request("action/validate_pem.php","POST",15,function(){error_box.innerHTML = "Network error. Please try again latter.";},
		function(req) 
		{
			let server_response = null;
			try
			{
				server_response = JSON.parse(req.responseText);
			}
			catch(e)
			{
				error_box.innerHTML = "The input PEM file is invalid.";
				return;
			}
		
			if(!server_response.hasOwnProperty("status") || !server_response.hasOwnProperty("hex_key") || server_response.status != "success")
			{
				error_box.innerHTML = "The input PEM file is invalid.";
				return;
			}
		
			localStorage.setItem("wallet_key",reader.result);
			localStorage.setItem("wallet_key_hex",server_response.hex_key);
			
			window.location.href = getURLparam("redir");
		}, post_args);
	
	}, false);

	reader.readAsText(pem_file);
}
