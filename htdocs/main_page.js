
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
			//to do
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
		console.error(reason);
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
			//to do
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
		console.error(reason);
	});
}


var max_allowed_contestants = false;
function get_max_allowed_contestants()
{
	if (localStorage.getItem("SC_max_allowed_contestants") !== null) 
	{
  		max_allowed_contestants = parseInt(localStorage.getItem("SC_max_allowed_contestants"));
  		check_competition_status();		
  		return;
	}

	querySC(SC_ADDR, "getMaxAllowedParticipants", [],
	function(api_data)
	{
		max_allowed_contestants = conv_SC_ret_to_uint(api_data);
		if(max_allowed_contestants === false)
		{
			//to do
			return;
		}
		
		localStorage.setItem("SC_max_allowed_contestants",max_allowed_contestants);
		
		check_competition_status();
	},
	function(req,reason)
	{
		console.error(reason);
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
			//to do
		}
		
		contestants_list[hex_addr] = contestant_info;
		
		querySC(SC_ADDR, "getVoteCount", [hex_addr], function(api_data2)
		{
			let contestant_votes = conv_SC_ret_to_uint(api_data2);
			if(contestant_votes == false)
			{
				//to do
			}
			
			contestants_list[hex_addr]["votes"] = contestant_votes;
			
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
					setTimeout(1000 * 150,get_registered_contestants);
				}
				localStorage.setItem("SC_contestants_list",JSON.stringify(contestants_list));
			
				check_competition_status();
			}
			
		},function(req,reason)
		{
			console.error(reason);
		});
		
	},
	function(req,reason)
	{
		console.error(reason);
	});
}

function get_registered_contestants()
{
	let last_contestants_list_query_time = localStorage.getItem("SC_last_contestants_list_query_time");
	
	//we cache the result for 2 minutes
	//if the registering period elapsed, no further updates are possible
	if( (last_contestants_list_query_time !== null && parseInt(last_contestants_list_query_time) > (new Date()).getTime() - 120000) || localStorage.getItem("SC_contestants_list_final") == "true")
	{
		contestants_list = JSON.parse(localStorage.getItem("SC_contestants_list"));
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
		console.error(reason);
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
	
	let counter = 0;
	for (let key in contestants_list)
	{
		if(counter == 5){ break; }
		
    		if(contestants_list.hasOwnProperty(key))
    		{
    			let current_row = contestants_table.insertRow();
    			
    			if(counter > 0)
    			{
    				current_row.style.borderTop = "2px solid white";
    			}
    			
    			let current_cell = current_row.insertCell();
    			current_cell.style.paddingTop = "0.5vh";
    			current_cell.style.paddingRight = "0.7vh";
    			current_cell.style.width = 0;
    			
    			let contestant_photo = document.createElement("div");
    			contestant_photo.style.position = "relative";
    			contestant_photo.style.height = "8vh";
    			contestant_photo.style.width = "7vh";
    			contestant_photo.style.backgroundImage = "url('" + contestants_list[key].photo_url + "')";
    			contestant_photo.style.border = "1px solid white";
    			contestant_photo.style.backgroundSize = "100% 100%";
    			current_cell.appendChild(contestant_photo);
    			current_cell.style.paddingLeft = "0.5vh";
    			
    			current_cell = current_row.insertCell();
    			current_cell.style.paddingTop = "0.5vh";
    			current_cell.innerHTML = "<b>" + contestants_list[key].name + "</b><br/>Age: <b>" + contestants_list[key].age + "</b><br/>Votes: <b>" + contestants_list[key].votes + "</b>";
    			
    			current_cell = current_row.insertCell();
    			current_cell.style.paddingTop = "0.5vh";
    			current_cell.style.verticalAlign = "middle";
    			current_cell.style.width = "0";
    			current_cell.innerHTML = "<div class='left_gadget_vote_btn' onclick=\"window.open('vote_participant.html?addr=" + key + "');\"><span style='position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);'>Vote</span></div>";
    			
    			current_row = contestants_table.insertRow();
			current_cell = current_row.insertCell();
			current_cell.colSpan = 3;
    			current_cell.innerHTML = contestants_list[key].desc;
    			
    			counter++;
    		}
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

function draw_registering_gadget()
{
	let contestants_table = document.createElement('table');
	contestants_table.style.border = "2px solid white";
	contestants_table.style.width = "100%";
	contestants_table.style.borderCollapse = "collapse";
	
	let counter = 0;
	for (let key in contestants_list)
	{
		if(counter == 5){ break; }
		
    		if(contestants_list.hasOwnProperty(key))
    		{
    			let current_row = contestants_table.insertRow();
    			
    			if(counter > 0)
    			{
    				current_row.style.borderTop = "2px solid white";
    			}
    			
    			let current_cell = current_row.insertCell();
    			current_cell.style.paddingTop = "0.5vh";
    			current_cell.style.paddingRight = "0.7vh";
    			current_cell.style.width = 0;
    			
    			let contestant_photo = document.createElement("div");
    			contestant_photo.style.position = "relative";
    			contestant_photo.style.height = "8vh";
    			contestant_photo.style.width = "7vh";
    			contestant_photo.style.backgroundImage = "url('" + contestants_list[key].photo_url + "')";
    			contestant_photo.style.border = "1px solid white";
    			contestant_photo.style.backgroundSize = "100% 100%";
    			current_cell.appendChild(contestant_photo);
    			current_cell.style.paddingLeft = "0.5vh";
    			
    			current_cell = current_row.insertCell();
    			current_cell.style.paddingTop = "0.5vh";
    			current_cell.innerHTML = "<b>" + contestants_list[key].name + "</b><br/>Age: <b>" + contestants_list[key].age + "</b><br/>Votes: <b>" + contestants_list[key].votes + "</b>";
    			
    			current_cell = current_row.insertCell();
    			current_cell.style.paddingTop = "0.5vh";
    			current_cell.style.verticalAlign = "middle";
    			current_cell.style.width = "0";
    			current_cell.innerHTML = "<div class='left_gadget_vote_btn' onclick=\"window.open('vote_participant.html?addr=" + key + "');\"><span style='position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);'>Vote</span></div>";
    			
    			current_row = contestants_table.insertRow();
			current_cell = current_row.insertCell();
			current_cell.colSpan = 3;
    			current_cell.innerHTML = contestants_list[key].desc;
    			
    			counter++;
    		}
	}
	
	let left_gadget = document.getElementById("left_app_gadget");
	left_gadget.innerHTML = "";
	left_gadget.appendChild(contestants_table);
}

function check_competition_status()
{
	if(voting_period_end_timestamp === false || registering_period_end_timestamp === false ||  max_allowed_contestants === false)
		return false;
		
	let t_now = (new Date()).getTime() / 1000;
	
	if(voting_period_end_timestamp < t_now && 0)
	{
		console.log("competition ended");
	}
	
	else if(registering_period_end_timestamp > t_now && max_allowed_contestants > Object.keys(contestants_list).length && 0)
	{
		document.getElementById("registering_period_info").style.display = "inline-block";
		draw_registering_gadget();
	}
	
	else
	{
		document.getElementById("voting_period_info").style.display = "inline-block";
		draw_voting_gadget();
	}
}


function adjust_page()
{
	let h = window.innerHeight;
  	let w = window.innerWidth;
  	
  	let page_table = document.getElementById("page_table");
  	
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
	
	adjust_page();
}

window.onload = page_load;
window.onresize = adjust_page;
