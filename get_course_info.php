<?php
	// pass in bldg, room, and date (in YYYMMDD format); If date is null, room info including
	// capacity is returned. If date is non-null, bookings near that date are returned.

	header('Content-type: application/json');
	$tld = "https://timetable.iit.artsci.utoronto.ca";

	$data = array();

	function arr_get($array, $key, $default = null){
	    return isset($array[$key]) ? $array[$key] : $default;
	}

	$year = arr_get($_GET, 'year', null);
	$session = arr_get($_GET, 'session', null);
	$course = arr_get($_GET, 'course', "");
	$instructor = arr_get($_GET, 'instructor', "");
	if ($year == null) {
		echo json_encode(array('status' => 'error', 'error' => 'No year specified'));
		exit();
	}
	if ($session == null) {
		echo json_encode(array('status' => 'error', 'error' => 'No session specified'));
		exit();
	}
	if ($course == null && $instructor == null) {
		echo json_encode(array('status' => 'error', 'error' => 'Must specify a course or instructor'));
		exit();
	}

	// make our variables conform to the utoronto.ca API
	// yearString should be YYYY5 for summer session and YYYY9 for fall
	// session. $year looks like "YYYY/YYYY" (e.g., "2017/2018"). Make
	// sure to get the second year for summer session and the first year
	// for fall session
	$yearString = substr($year, 0, 4) . "9";
	$sessionString = $session;
	if (strlen($session) == 2) {
		$yearString = substr($year, -4, 4) . "5";
		$sessionString = substr($session, -1, 1);
	}
	
	// get the room info
	$ch = curl_init();
	// now grab scheduling data
	$instructor = urlencode($instructor);
	$info_url = "$tld/api/$yearString/courses?code=$course&section=$sessionString&prof=$instructor";
	
	curl_setopt($ch, CURLOPT_URL, $info_url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	$course_info = curl_exec($ch);
	curl_close($ch);

	if (substr($course_info, 0, 1) != '{') {
		echo json_encode(array('status' => 'error', 'error' => 'No course information found'));
		exit();
	}
	echo $course_info;

?> 
