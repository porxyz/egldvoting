<?php

include_once("../functions/php_api/sc_encoding.php");
include_once("../functions/php_api/sc_query.php");

function get_participant_votes($SC,$SC_args)
{
	$api_result = querySCdata($SC,"getVoteCount",$SC_args);
	if($api_result == NULL or $api_result < 0)
	{
		return -1;
	}
	
	$vote_number = decode_elrond_data($api_result[0],"u64");
	if($vote_number == false)
	{
		return 0;
	}
	
	return $vote_number;
}

if(!isset($_POST["search_input"]) or !isset($_POST["SC"]))
{
	die(json_encode(array("status" => "error")));
}

$SC_args = array();

//hex address
if(strlen($_POST["search_input"]) == 64 and hex2bin($_POST["search_input"]) !== false)
{
	$SC_args[] = $_POST["search_input"];
}

//try with bech32
else
{
	try
	{
		$SC_args[] = bin2hex(bech32_decode("erd",$_POST["search_input"]));
	}
	catch(Exception $e)
	{
		//try with nickname
		$api_result = querySCdata($_POST["SC"],"getParticipantAddrByName",array( bin2hex($_POST["search_input"]) ));
		if($api_result == NULL or $api_result < 0)
		{
			echo(json_encode( array("search_result" => array() ) ));
			exit;
		}
		
		$SC_args[] = bin2hex(base64_decode($api_result[0]));
	}
}

$api_result = querySCdata($_POST["SC"],"getParticipantInfo",$SC_args);
if($api_result == NULL or $api_result < 0)
{
		echo(json_encode( array("search_result" => array() ) ));
		exit;
}
	
$participant_info = decode_elrond_data($api_result[0],"participant_info"); 
if($participant_info == false)
{
	die(json_encode(array("status" => "error")));
}
	
$participant_votes = get_participant_votes($_POST["SC"],$SC_args);
if($participant_votes < 0)
{
	die(json_encode(array("status" => $participant_votes)));
}
	
$participant_info["votes"] = $participant_votes;
$participant_info["address"] = $SC_args[0];
	
echo(json_encode( array("search_result" => array($participant_info) ) ));

?>
