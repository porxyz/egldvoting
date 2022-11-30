<?php

include_once("../functions/php_api/sc_encoding.php");
include_once("../functions/php_api/sc_call.php");

if(!isset($_POST["pem"]) or strlen($_POST["pem"]) > 10000 or !isset($_POST["SC"]) or !isset($_POST["addr"]))
{
	die(json_encode(array("status" => "error")));
}

$result = callSCfunction($_POST["SC"],"1000000000000000000",$_POST["pem"],"vote_participant",array($_POST["addr"]));
if($result < 0)
{
	die(json_encode(array("status" => "SC_error")));
}

echo(json_encode(array("tx" => $result)));

?>
