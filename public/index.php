<?php
// === CONFIGURATION ===
$firebase_project_id = "bukberapp"; // from your .env
$default_title = "Pesan Sini - Catat Pesanan Bersama";
$default_desc = "Aplikasi pencatat pesanan grup yang memudahkan koordinasi dan patungan bersama rekan Anda.";
$default_image = "https://pesansini.putary.cloud/pesansini-transparant.png";
$base_url = "https://pesansini.putary.cloud";

// 1. Get the requested URI (e.g., /j/123456)
$request_uri = $_SERVER['REQUEST_URI'];
$is_join_link = preg_match('/^\/j\/([0-9A-Za-z]+)/i', $request_uri, $matches);

// 2. Default Meta values
$meta_title = $default_title;
$meta_desc = $default_desc;
$meta_image = $default_image;

// 3. If it's a join link, fetch data from Firebase REST API
if ($is_join_link && isset($matches[1])) {
    $room_code = $matches[1];
    
    // Construct Firestore REST URL
    // We search the 'rooms' collection for the 'roomCode' field
    $firestore_url = "https://firestore.googleapis.com/v1/projects/{$firebase_project_id}/databases/(default)/documents:runQuery";
    
    // Prepare the GraphQL-like query body for Firestore REST API
    $post_data = json_encode([
        "structuredQuery" => [
            "from" => [["collectionId" => "rooms"]],
            "where" => [
                "fieldFilter" => [
                    "field" => ["fieldPath" => "roomCode"],
                    "op" => "EQUAL",
                    "value" => ["stringValue" => $room_code]
                ]
            ],
            "limit" => 1
        ]
    ]);

    // Setup cURL to Firebase REST API
    $ch = curl_init($firestore_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code == 200 && $response) {
        $data = json_decode($response, true);
        
        // Check if we got a document back
        if (isset($data[0]['document'])) {
            $doc_fields = $data[0]['document']['fields'];
            
            // Extract useful info safely
            $eventName = isset($doc_fields['eventName']['stringValue']) ? $doc_fields['eventName']['stringValue'] : "";
            $hostName = isset($doc_fields['hostName']['stringValue']) ? $doc_fields['hostName']['stringValue'] : "Seseorang";
            $restaurantName = isset($doc_fields['restaurantName']['stringValue']) ? $doc_fields['restaurantName']['stringValue'] : "Restoran";
            
            if ($eventName) {
                // We successfully found the room! Override the Meta Tags.
                $meta_title = "Undangan: $eventName";
                $meta_desc = "$hostName mengundang Anda untuk bergabung ke pesanan makanan di $restaurantName. Yuk, pilih menu Anda di sini!";
            }
        }
    }
}

// 4. Read the production build's index.html
$index_path = __DIR__ . '/index.html';
if (!file_exists($index_path)) {
    die("Error: index.html not found. Please run 'npm run build' first.");
}

$html = file_get_contents($index_path);

// 5. Replace the static meta tags in index.html with our dynamic ones
// We do this using simple string replacement for reliability

// Replace Title
$html = preg_replace('/<title>.*?<\/title>/s', "<title>$meta_title</title>", $html);

// Replace OpenGraph tags
$html = preg_replace('/<meta property="og:title" content=".*?" \/>/s', '<meta property="og:title" content="' . htmlspecialchars($meta_title) . '" />', $html);
$html = preg_replace('/<meta property="og:description" content=".*?" \/>/s', '<meta property="og:description" content="' . htmlspecialchars($meta_desc) . '" />', $html);

// Replace Twitter tags
$html = preg_replace('/<meta property="twitter:title" content=".*?" \/>/s', '<meta property="twitter:title" content="' . htmlspecialchars($meta_title) . '" />', $html);
$html = preg_replace('/<meta property="twitter:description" content=".*?" \/>/s', '<meta property="twitter:description" content="' . htmlspecialchars($meta_desc) . '" />', $html);

// General Description
$html = preg_replace('/<meta name="description" content=".*?" \/>/s', '<meta name="description" content="' . htmlspecialchars($meta_desc) . '" />', $html);

// 6. Serve the modified HTML to the browser/bot
echo $html;
?>
