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

function search_participant()
{	
	let input_participant = document.getElementById("input_addr");
	let msg_box = document.getElementById("wallet_search_results");
	
	msg_box.innerHTML = "<span class='loading_text_animation'></span>";
	animate_loading_text_p();
	
	if(input_participant.value.length == 0)
	{
		msg_box.innerHTML = "<span style='color:red'>Please complete the contestant name or address.</span>";
		return;
	}
	
	let post_args = {search_input: input_participant.value, SC: SC_ADDR};
	 
	make_http_request("action/search_participant.php","POST",15,function(){msg_box.innerHTML = "<span style='color:red'>Network error. Please try again latter.</span>";},
	function(req) 
	{
		let server_response = null;
		try
		{
			server_response = JSON.parse(req.responseText);
		}
		catch(e)
		{
			msg_box.innerHTML = "<span style='color:red'>Invalid server response. Please try again latter.</span>";
			return;
		}
		
		if(!server_response.hasOwnProperty("search_result") || !Array.isArray(server_response.search_result))
		{
			msg_box.innerHTML = "<span style='color:red'>Something went wrong. Please try again latter.</span>";
			return;
		}
		
		if(server_response.search_result.length == 0)
		{
			msg_box.innerHTML = "No contestant was found.";
			return;
		}
		
		let participant = server_response.search_result[0];
		
		if(!participant.hasOwnProperty("name") || !participant.hasOwnProperty("age") || !participant.hasOwnProperty("address") || !participant.hasOwnProperty("desc") || !participant.hasOwnProperty("photo_url"))
		{
			msg_box.innerHTML = "<span style='color:red'>Something went wrong. Please try again latter.</span>";
			return;
		}
		
		
		let output_html = "<table style='border: 2px solid white; width:60%;'><tr><td style='width:0; padding-top:0.5vh; padding-right: 0.7vh; padding-left:0.5vh;'>";
		output_html += "<div style=\"position:relative; height:8vh; width: 7vh; background-image:url('" + html_escape(participant.photo_url) + "'); ";
		output_html += "background-size:100% 100%; border:1px solid white;\"></div></td><td style='padding-top:0.5vh;'>";
		output_html += "<b>" + participant.name + "</b><br/>Age: <b>" + participant.age + "</b><br/>Votes: <b>"+ participant.votes +"</b></td>";
		output_html += "<td style='padding-top:0.5vh; vertical-align:middle; width:0; ";
		
		if(localStorage.getItem("user_voted") == "true")
		{
			output_html += "visibility:hidden; ";
		}
		
		output_html += "'><div class='left_gadget_vote_btn'";
		output_html += "onclick=\"window.open('vote_participant.html?addr=" + participant.address + "');\"><span style='position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);'>Vote</span></div></td></tr>";
		output_html += "<tr><td colspan='3' style='padding-top:0.5vh; padding-left:0.5vh;'>" + html_escape(participant.desc,true) + "</td></tr></table>";		
	
		msg_box.innerHTML = output_html;
	}, post_args);
	
}
