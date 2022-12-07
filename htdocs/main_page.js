
function disp_voting_period_end()
{
	let end_datetime = new Date(voting_period_end_timestamp * 1000);
	let d_now = new Date();
	
	if(end_datetime.getTime() < d_now.getTime())
	{
		window.location.reload();
	}
	
	let disp_text = format_date_diff(end_datetime,d_now);
	document.getElementById("voting_period_end_disp").innerHTML = disp_text;
}

function disp_registering_period_end()
{
	let end_datetime = new Date(registering_period_end_timestamp * 1000);
	let d_now = new Date();
	
	if(end_datetime.getTime() < d_now.getTime())
	{
		window.location.reload();
	}
	
	let disp_text = format_date_diff(end_datetime,d_now);
	document.getElementById("registering_period_end_disp").innerHTML = disp_text;
}


var voting_period_end_timestamp = false;
function get_voting_period_end_timestamp()
{
	if (localStorage.getItem("SC_voting_period_end_timestamp") !== null) 
	{
  		voting_period_end_timestamp = parseInt(localStorage.getItem("SC_voting_period_end_timestamp"));
  		
  		let end_datetime = new Date(voting_period_end_timestamp * 1000);
		let d_now = new Date();
		
		if(end_datetime.getTime() > d_now.getTime())
		{
			setInterval(disp_voting_period_end,1000);
		}
		
		check_competition_status();
  		return;
	}

	querySC(SC_ADDR, "getEndTime", [],
	function(api_data)
	{
		voting_period_end_timestamp = conv_SC_ret_to_uint(api_data);
		if(voting_period_end_timestamp === false)
		{
			setTimeout(get_voting_period_end_timestamp,20 * 1000);
			return;
		}
		
		localStorage.setItem("SC_voting_period_end_timestamp",voting_period_end_timestamp);
		
		let end_datetime = new Date(voting_period_end_timestamp * 1000);
		let d_now = new Date();
		
		if(end_datetime.getTime() > d_now.getTime())
		{
			setInterval(disp_voting_period_end,1000);
		}
		
		check_competition_status();
		
	},
	function(req,reason)
	{
		setTimeout(get_voting_period_end_timestamp,20 * 1000);
	});
}

var registering_period_end_timestamp = false;
function get_registering_period_end_timestamp()
{
	if (localStorage.getItem("SC_registering_period_end_timestamp") !== null) 
	{
  		registering_period_end_timestamp = parseInt(localStorage.getItem("SC_registering_period_end_timestamp"));
  		
  		let end_datetime = new Date(registering_period_end_timestamp * 1000);
		let d_now = new Date();
		
		if(end_datetime.getTime() > d_now.getTime())
		{
			setInterval(disp_registering_period_end,1000);
		}
		
		check_competition_status();
  		return;
	}

	querySC(SC_ADDR, "getRegisteringEndTime", [],
	function(api_data)
	{
		registering_period_end_timestamp = conv_SC_ret_to_uint(api_data);
		if(registering_period_end_timestamp === false)
		{
			setTimeout(get_registering_period_end_timestamp,20 * 1000);
			return;
		}
		
		localStorage.setItem("SC_registering_period_end_timestamp",registering_period_end_timestamp);
		
		let end_datetime = new Date(registering_period_end_timestamp * 1000);
		let d_now = new Date();
		
		if(end_datetime.getTime() > d_now.getTime())
		{
			setInterval(disp_registering_period_end,1000);
		}
		
		check_competition_status();
	},
	function(req,reason)
	{
		setTimeout(get_registering_period_end_timestamp,20 * 1000);
	});
}


var max_allowed_contestants = false;
function get_max_allowed_contestants()
{
	if (localStorage.getItem("SC_max_allowed_contestants") !== null) 
	{
  		max_allowed_contestants = parseInt(localStorage.getItem("SC_max_allowed_contestants"));
  		document.getElementById("registering_max_peers_disp").innerHTML = max_allowed_contestants;
  		check_competition_status();		
  		return;
	}

	querySC(SC_ADDR, "getMaxAllowedParticipants", [],
	function(api_data)
	{
		max_allowed_contestants = conv_SC_ret_to_uint(api_data);
		if(max_allowed_contestants === false)
		{
			setTimeout(get_max_allowed_contestants,20 * 1000);
			return;
		}
		
		localStorage.setItem("SC_max_allowed_contestants",max_allowed_contestants);
		document.getElementById("registering_max_peers_disp").innerHTML = max_allowed_contestants;
		
		check_competition_status();
	},
	function(req,reason)
	{
		setTimeout(get_max_allowed_contestants,20 * 1000);
	});
}


var contestants_list = {};
var contestant_get_data_req_finish = [];

function get_contestant_data(hex_addr,req_id)
{
	querySC(SC_ADDR, "getParticipantInfo", [hex_addr],
	function(api_data)
	{
		let contestant_info = conv_SC_ret_to_contestant_info(api_data);
		if(contestant_info == false)
		{
			setTimeout(get_registered_contestants, 1000 * 120);
			return;
		}
		
		contestants_list[hex_addr] = contestant_info;
		
		querySC(SC_ADDR, "getVoteCount", [hex_addr], function(api_data2)
		{
			let contestant_votes = conv_SC_ret_to_uint(api_data2);
			if(contestant_votes == false)
			{
				contestants_list[hex_addr]["votes"] = 0;
			}
			else
			{
				contestants_list[hex_addr]["votes"] = contestant_votes;
			}
			
			contestant_get_data_req_finish[req_id] = true;
	
			let load_complete = true;
			for(let idx = 0; idx < contestant_get_data_req_finish.length; idx++)
			{
				if(!contestant_get_data_req_finish[idx])
				{
					load_complete = false;
					break;
				}
			}
		
			if(load_complete)
			{
				localStorage.setItem("SC_last_contestants_list_query_time",(new Date()).getTime());
			
				//we reached max participants or registration period expired
				if(api_data.length === max_allowed_contestants || (registering_period_end_timestamp !== false && (registering_period_end_timestamp * 1000 < (new Date()).getTime()) ) )
				{
					localStorage.setItem("SC_contestants_list_final","true");
				}
				else
				{
					setTimeout(get_registered_contestants, 1000 * 120);
				}
				
				document.getElementById("registering_current_peers_disp").innerHTML = Object.keys(contestants_list).length;
				localStorage.setItem("SC_contestants_list",JSON.stringify(contestants_list));
			
				check_competition_status();
			}
			
		},function(req,reason)
		{
			setTimeout(get_registered_contestants, 1000 * 120);
			return;
		});
		
	},
	function(req,reason)
	{
		setTimeout(get_registered_contestants, 1000 * 120);
		return;
	});
}

function get_registered_contestants()
{
	let last_contestants_list_query_time = localStorage.getItem("SC_last_contestants_list_query_time");
	
	//we cache the result for about 2 minutes
	//if the registering period elapsed, no further updates are possible
	if( (last_contestants_list_query_time !== null && parseInt(last_contestants_list_query_time) > (new Date()).getTime() - 100 * 1000) || localStorage.getItem("SC_contestants_list_final") == "true")
	{
		contestants_list = JSON.parse(localStorage.getItem("SC_contestants_list"));
		document.getElementById("registering_current_peers_disp").innerHTML = Object.keys(contestants_list).length;
		check_competition_status();
		return;
	}
	
	querySC(SC_ADDR, "getParticipants", [],
	function(api_data)
	{	
		for(let idx = 0; idx < api_data.length; idx++)
		{
			contestants_list[conv_SC_ret_to_hex_addr(api_data[idx])] = {name: false, age: false, desc: false, photo_url: false, votes: false};
			contestant_get_data_req_finish[idx] = false;
			get_contestant_data(conv_SC_ret_to_hex_addr(api_data[idx]),idx);
		}
	},
	function(req,reason)
	{
		setTimeout(get_registered_contestants, 1000 * 120);
		return;
	});
}

function check_if_user_is_contestant()
{
	//user is already registered or no wallet connected
	if(localStorage.getItem("user_registered") != null || localStorage.getItem("wallet_key_hex") == null) 
	{
		return;
	}
	
	querySC(SC_ADDR, "getParticipantInfo", [localStorage.getItem("wallet_key_hex")],
	function(api_data)
	{	
		if(Array.isArray(api_data) && api_data.length > 0)
		{
			localStorage.setItem("user_registered","true");
			return;
		}
		
		setTimeout(check_if_user_is_contestant,1000 * 20);
	},
	function(req,reason)
	{
		setTimeout(check_if_user_is_contestant,1000 * 20);
	});
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

function draw_voting_gadget()
{
	let contestants_table = document.createElement('table');
	contestants_table.style.border = "2px solid white";
	contestants_table.style.width = "100%";
	contestants_table.style.borderCollapse = "collapse";
	
	let user_voted = localStorage.getItem("user_voted");
	let counter = 0;
	
	let sorted_contestants = [];
	for (let key in contestants_list)
	{
		if(contestants_list.hasOwnProperty(key))
    		{
			let current_contestant = contestants_list[key];
			current_contestant.address = key;
			sorted_contestants.push(current_contestant);
		}
	}
	sorted_contestants.sort(function(a,b){return b.votes - a.votes;});
	
	if(localStorage.getItem("user_registered") == "true")
	{
		let user_addr = localStorage.getItem("wallet_key_hex");
		let registered_contestant_idx = -1;
		
		for(let idx = 0; idx < sorted_contestants.length; idx++)
		{
			if(sorted_contestants[idx].address == user_addr)
			{
				registered_contestant_idx = idx;
				break;
			}
		}
		
		if(registered_contestant_idx != -1)
		{
			sorted_contestants.unshift(sorted_contestants[registered_contestant_idx]);
			sorted_contestants.splice(registered_contestant_idx + 1, 1);
		}
	}
		
	while (counter != sorted_contestants.length && counter < 5)
	{	
    		let current_row = contestants_table.insertRow();
    			
    		if(counter > 0)
    		{
    			current_row.style.borderTop = "2px solid white";
    		}
    			
    		let current_cell = current_row.insertCell();
    		current_cell.style.paddingTop = "0.5vh";
    		current_cell.style.paddingRight = "0.7vh";
    		current_cell.style.paddingLeft = "0.5vh";
    		current_cell.style.width = 0;
    			
    		let contestant_photo = document.createElement("div");
    		contestant_photo.style.position = "relative";
    		contestant_photo.style.height = "8vh";
    		contestant_photo.style.width = "7vh";
    		contestant_photo.style.backgroundImage = "url('" + html_escape(sorted_contestants[counter].photo_url) + "')";
    		contestant_photo.style.border = "1px solid white";
    		contestant_photo.style.backgroundSize = "100% 100%";
    		current_cell.appendChild(contestant_photo);
    			
    		current_cell = current_row.insertCell();
    		current_cell.style.paddingTop = "0.5vh";
    		current_cell.innerHTML = "<b>" + sorted_contestants[counter].name + "</b><br/>Age: <b>" + sorted_contestants[counter].age + "</b><br/>Votes: <b>" + sorted_contestants[counter].votes + "</b>";
    			
    		current_cell = current_row.insertCell();
    		current_cell.style.paddingTop = "0.5vh";
    		current_cell.style.verticalAlign = "middle";
    		current_cell.style.width = "0";
    			
    		if(user_voted == "true")
    		{
    			current_cell.style.visibility = "hidden";
    		}
    			
    		current_cell.innerHTML = "<div class='left_gadget_vote_btn' onclick=\"window.open('vote_participant.html?addr=" + sorted_contestants[counter].address + "');\"><span style='position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);'>Vote</span></div>";
    			
    		current_row = contestants_table.insertRow();
		current_cell = current_row.insertCell();
		current_cell.colSpan = 3;
		current_cell.style.paddingLeft = "0.5vh";
    		current_cell.innerHTML = html_escape(sorted_contestants[counter].desc,true);
    			
    		counter++;
	}
	
	let vote_another_spn = document.createElement("span");
	vote_another_spn.style.marginTop = "1.2vh";
	vote_another_spn.style.display = "inline-block";
    	vote_another_spn.innerHTML = "<span class=\"spn_link\" onclick=\"window.open('search_participant.html');\">Vote for another candidate</span>";
	
	let left_gadget = document.getElementById("left_app_gadget");
	left_gadget.innerHTML = "";
	left_gadget.appendChild(contestants_table);
	left_gadget.appendChild(vote_another_spn);
}

function check_input_photo_url()
{
	let input_url_field = document.getElementById("input_photo");
	let msg_box = document.getElementById("left_register_err_msg");
	
	//clear previous error message
	msg_box.innerHTML = "";
	
	//empty input
	if(input_url_field.value.length == 0)
	{
		input_url_field.focus();
		msg_box.innerHTML = "Please provide an input URL";
		return;
	}
	
	//invalid url
	else if(!isURLValid(input_url_field.value))
	{
		input_url_field.focus();
		msg_box.innerHTML = "The URL is not valid";
		return;
	}
	
	//check if bad image
	let test_image = document.createElement("img");
	
	test_image.onerror = function () 
	{
  		input_url_field.focus();
		msg_box.innerHTML = "The image can't be opened";
	};
	
	//load complete
	test_image.onload = function () 
	{
  		let display_photo = document.getElementById("left_register_photo").style.backgroundImage = "url('" + input_url_field.value + "')";
	};

	test_image.src = input_url_field.value;
}

function submit_register_form()
{
	let msg_box = document.getElementById("left_register_err_msg");
	
	let input_name_field = document.getElementById("input_user");
	let input_age_field = document.getElementById("input_age");
	let input_desc_field = document.getElementById("input_desc");
	let input_url_field = document.getElementById("input_photo");
	
	//clear previous error message
	msg_box.innerHTML = "";
	
	//name sanity check
	if(input_name_field.value.length == 0)
	{
		input_name_field.focus();
		msg_box.innerHTML = "Please enter your name";
		return;
	}
	
	if(input_name_field.value.length > 64)
	{
		input_name_field.focus();
		msg_box.innerHTML = "The name is too long";
		return;
	}
	
	const r_exp = new RegExp("[^A-Za-z ]",'g');
	
	if(input_name_field.value.match(r_exp) != null)
	{
		input_name_field.focus();
		msg_box.innerHTML = "The name should contain only letters";
		return;
	}
	
	if(contestants_list != null)
	{
		let name_found = false;
		
		for(let addr in contestants_list)
		{
			if(contestants_list[addr].name == input_name_field.value)
			{
				name_found = true;
				break;
			}
		}
		
		if(name_found)
		{
			input_name_field.focus();
			msg_box.innerHTML = "Name is already taken";
			return;
		}
	}
	
	//age sanity check
	if(input_age_field.value.length == 0)
	{
		input_age_field.focus();
		msg_box.innerHTML = "Please enter your age";
		return;
	}
	
	if(input_age_field.value != parseInt(input_age_field.value))
	{
		input_age_field.focus();
		msg_box.innerHTML = "Age must be a number";
		return;
	}
	
	if(parseInt(input_age_field.value) < 0)
	{
		input_age_field.focus();
		msg_box.innerHTML = "Age can't be negative";
		return;
	}
	
	if(parseInt(input_age_field.value) > 255)
	{
		input_age_field.focus();
		msg_box.innerHTML = "Age can't be more than 255";
		return;
	}
	
	//description sanity check
	if(input_desc_field.value.length == 0)
	{
		input_desc_field.focus();
		msg_box.innerHTML = "Please enter your description";
		return;
	}
	
	if(input_desc_field.value.length > 200)
	{
		input_desc_field.focus();
		msg_box.innerHTML = "Please enter a shorter description";
		return;
	}
	
	//profile photo URL check
	if(input_url_field.value.length == 0)
	{
		input_url_field.focus();
		msg_box.innerHTML = "Please provide an input URL";
		return;
	}
	
	else if(!isURLValid(input_url_field.value))
	{
		input_url_field.focus();
		msg_box.innerHTML = "The URL is not valid";
		return;
	}
	
	let partcipant_info = {name: input_name_field.value, age: input_age_field.value, desc: input_desc_field.value, photo_url: input_url_field.value};
	
	let register_url = "register_participant.html?data=" + encodeURIComponent(JSON.stringify(partcipant_info));
	window.open(register_url);
}

function draw_registering_gadget()
{
	//user is registered
	if(localStorage.getItem("user_registered") == "true" && localStorage.getItem("wallet_key_hex") != null && contestants_list != null && contestants_list.hasOwnProperty(localStorage.getItem("wallet_key_hex"))) 
	{
		let participant = contestants_list[localStorage.getItem("wallet_key_hex")];
		
		let register_form_html = "<table style='border: 2px solid white; width:100%;'><tr><td style='width:0; padding-top:0.5vh; padding-right: 0.7vh; padding-left:0.5vh;'>";
		register_form_html += "<div style=\"position:relative; height:8vh; width: 7vh; background-image:url('" + html_escape(participant.photo_url) + "'); ";
		register_form_html += "background-size:100% 100%; border:1px solid white;\"></div></td><td style='padding-top:0.5vh;'>";
		register_form_html += "<b>" + participant.name + "</b><br/>Age: <b>" + participant.age + "</b></td></tr>";
		register_form_html += "<tr><td colspan='2' style='padding-top:0.5vh; padding-left:0.5vh;'>" + html_escape(participant.desc,true) + "</td></tr></table>";
	
		let left_gadget = document.getElementById("left_app_gadget");
		left_gadget.innerHTML = register_form_html;
		
		return;
	}
	
	let register_form_html = "<span style='font-weight:bold;'>Register as a constestant</span><br/><br/><br/>";
	register_form_html += "<div id='left_register_photo' style=\"background-image:url('media/images/default_profile_photo.png');\"></div><br/>";
	register_form_html += "<input class='left_register_input' type='text' id='input_user' maxlength='64' placeholder='Display name'/><br/>";
	register_form_html += "<input class='left_register_input' type='text' id='input_age' placeholder='Age'/><br/>";
	register_form_html += "<textarea class='left_register_input' type='text' id='input_desc' style='resize:none; height:8vh;' maxlength='200' placeholder='Short description'/></textarea><br/><br/>";
	register_form_html += "<input class='left_register_input' type='text' id='input_photo' placeholder='Profile photo URL'/><br/><br/>";
	register_form_html += "<span id='left_register_err_msg'></span><br/>";
	register_form_html += "<table style='width:100%;'><tr><td style='width:0;'><div style='width:14vh; margin-bottom:1vh;' class='left_gadget_vote_btn' onclick='check_input_photo_url();'>";
	register_form_html += "<span style='position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'>Test photo</span></div></td><td>";
	register_form_html += "<div style='width:14vh; margin-bottom:1vh;' class='left_gadget_vote_btn' onclick='submit_register_form();'>";
	register_form_html += "<span style='position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'>Register</span></div></td></tr></table>";
	
	let left_gadget = document.getElementById("left_app_gadget");
	left_gadget.innerHTML = register_form_html;
}

function draw_winning_info()
{
	let winner = contestants_list[Object.keys(contestants_list)[0]];
	let all_votes = 0;
	
	for(let addr in contestants_list)
	{
		if(winner.votes < contestants_list[addr].votes)
		{
			winner = contestants_list[addr];
		}
		
		all_votes += contestants_list[addr].votes;
	}
	
	let vote_percentage = (winner.votes / all_votes) * 100.0;
	let html_code = "<span><b>" + winner.name + "</b> won the competition with <b>" + winner.votes + "</b> votes (<b>" + vote_percentage.toFixed(2) + "%</b>) ! </span>";
	
	document.getElementById("contest_finish_info").innerHTML += html_code;
	
	let page_table = document.getElementById("page_table");
  	page_table.rows[0].cells[1].style = "width:100%";
  	page_table.rows[0].deleteCell(0);
  	
  	document.getElementById("app_description").style = "padding-left:0";
}

function check_competition_status()
{
	if(voting_period_end_timestamp === false || registering_period_end_timestamp === false ||  max_allowed_contestants === false)
		return false;
		
	let t_now = (new Date()).getTime() / 1000;
	
	if(voting_period_end_timestamp < t_now)
	{
		document.getElementById("contest_finish_info").style.display = "inline-block;"
		document.getElementById("registering_period_info").style.display = "none";
		document.getElementById("voting_period_info").style.display = "none";
		draw_winning_info();
	}
	
	else if(registering_period_end_timestamp > t_now && max_allowed_contestants > Object.keys(contestants_list).length)
	{
		document.getElementById("registering_period_info").style.display = "inline-block";
		document.getElementById("contest_finish_info").style.display = "none";
		document.getElementById("voting_period_info").style.display = "none";
		draw_registering_gadget();
	}
	
	else
	{
		document.getElementById("registering_period_info").style.display = "none";
		document.getElementById("contest_finish_info").style.display = "none";
		document.getElementById("voting_period_info").style.display = "inline-block";
		draw_voting_gadget();
	}
}


function adjust_page()
{
	let h = window.innerHeight;
  	let w = window.innerWidth;
  	
  	let page_table = document.getElementById("page_table");
  	
  	if(localStorage.getItem("SC_contestants_list_final") == "true")
  	{
  		return;
  	}
  	
  	let row_count = page_table.rows.length;
  	
  	//convert from landscape to portrait
  	if(h > w && row_count == 1)
  	{
  		page_table.rows[0].cells[0].style = "width:100%";
  		page_table.insertRow().insertCell().innerHTML = page_table.rows[0].cells[1].innerHTML;
  		page_table.rows[0].deleteCell(1);
  	}
  	
  	//convert from portrait to landscape
  	else if(h < w && row_count == 2)
  	{
  		page_table.rows[0].cells[0].style = "width:30%";
  		page_table.rows[0].insertCell().innerHTML = page_table.rows[1].cells[0].innerHTML;
  		page_table.deleteRow(1);
  	}
}

function page_load()
{
	animate_loading_text_p();
	get_max_allowed_contestants();
	get_registered_contestants();
	get_voting_period_end_timestamp();
	get_registering_period_end_timestamp();
	
	check_if_user_is_contestant();
	
	adjust_page();
}

window.onload = page_load;
window.onresize = adjust_page;
