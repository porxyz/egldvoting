<?php

include_once("../functions/php_api/sc_encoding.php");
include_once("../functions/php_api/sc_call.php");

if(!isset($_POST["pem"]) or strlen($_POST["pem"]) > 10000 or !isset($_POST["data"]) or !isset($_POST["SC"]))
{
	die(json_encode(array("status" => "error")));
}

$dec_data = json_decode($_POST["data"]);
if($dec_data === NULL or !property_exists($dec_data,"name") or !property_exists($dec_data,"age") or !property_exists($dec_data,"desc") or !property_exists($dec_data,"photo_url"))
{
	die(json_encode(array("status" => "error")));
}

$SC_args = array(bin2hex($dec_data->name), str_pad(dechex($dec_data->age), 2, "0", STR_PAD_LEFT), bin2hex($dec_data->desc), bin2hex($dec_data->photo_url));

$result = callSCfunction($_POST["SC"],"15000000000000000000",$_POST["pem"],"register_participant",$SC_args);
if($result < 0)
{
	die(json_encode(array("status" => "SC_error")));
}

echo(json_encode(array("tx" => $result)));

?>
