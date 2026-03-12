/*
 * Custom Endpoint: csvprocess
 * Processes CSV data and updates user statuses
 */
(function () {
    try {
        var content = request.content;
        var csvData = content.csvData;
        
        if (!csvData) {
            return {
                status: 400,
                headers: {"Content-Type": "application/json"},
                body: {
                    success: false,
                    message: "No CSV data provided"
                }
            };
        }
        
        // Decode base64 CSV data
        var decodedBytes = org.forgerock.util.encode.Base64.decode(csvData);
        var csvText = new java.lang.String(decodedBytes, "UTF-8");
        
        // Parse CSV
        var lines = csvText.split(/\r?\n/);
        var emailColumnIndex = -1;
        var processed = 0;
        var updated = 0;
        var notFound = 0;
        var details = [];
        
        // Find email column in header
        if (lines.length > 0) {
            var headers = lines[0].split(',');
            for (var h = 0; h < headers.length; h++) {
                var header = headers[h].trim().toLowerCase();
                if (header === 'email' || header === 'mail' || header === 'emailaddress') {
                    emailColumnIndex = h;
                    break;
                }
            }
        }
        
        // If no email column found, assume first column
        if (emailColumnIndex === -1) {
            emailColumnIndex = 0;
        }
        
        // Process each line (skip header)
        for (var i = 1; i < lines.length; i++) {
            var line = lines[i].trim();
            
            if (!line || line.length === 0) {
                continue; // Skip empty lines
            }
            
            var columns = line.split(',');
            if (columns.length <= emailColumnIndex) {
                continue; // Skip malformed lines
            }
            
            var email = columns[emailColumnIndex].trim();
            
            // Remove quotes if present
            email = email.replace(/^["']|["']$/g, '');
            
            if (!email || email.length === 0) {
                continue;
            }
            
            processed++;
            
            try {
                // Query for user by email
                var queryParams = {
                    "_queryFilter": 'mail eq "' + email + '"'
                };
                
                var queryResult = openidm.query("managed/alpha_user", queryParams);
                
                if (queryResult.result && queryResult.result.length > 0) {
                    var user = queryResult.result[0];
                    var userId = user._id;
                    
                    // Update user status
                    var patchOperations = [
                        {
                            "operation": "replace",
                            "field": "/accountStatus",
                            "value": "inactive"
                        }
                    ];
                    
                    openidm.patch("managed/alpha_user/" + userId, null, patchOperations);
                    
                    updated++;
                    details.push({
                        email: email,
                        success: true,
                        message: "Updated to inactive"
                    });
                    
                } else {
                    notFound++;
                    details.push({
                        email: email,
                        success: false,
                        message: "User not found"
                    });
                }
                
            } catch (e) {
                details.push({
                    email: email,
                    success: false,
                    message: "Error: " + e.message
                });
            }
        }
        
        return {
            status: 200,
            headers: {"Content-Type": "application/json"},
            body: {
                success: true,
                processed: processed,
                updated: updated,
                notFound: notFound,
                details: details,
                message: "Processed " + processed + " users: " + updated + " updated, " + notFound + " not found"
            }
        };
        
    } catch (error) {
        return {
            status: 500,
            headers: {"Content-Type": "application/json"},
            body: {
                success: false,
                message: "Server error: " + error.message,
                error: String(error)
            }
        };
    }
}());
