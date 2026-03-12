/*
 * Custom Endpoint: csvupload
 * Serves an HTML page for uploading CSV files
 */
(function () {
    var requestParams = request.additionalParameters;
    var sessionToken = requestParams.sessionToken || '';
    
    // Get the base URL dynamically
    var baseUrl = request.parent.scheme + "://" + request.parent.authority;
    
    var html = '<!DOCTYPE html>' +
        '<html lang="en">' +
        '<head>' +
        '    <meta charset="UTF-8">' +
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '    <title>CSV User Status Update</title>' +
        '    <style>' +
        '        * { box-sizing: border-box; }' +
        '        body {' +
        '            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
        '            max-width: 700px;' +
        '            margin: 50px auto;' +
        '            padding: 20px;' +
        '            background: #f5f5f5;' +
        '        }' +
        '        .container {' +
        '            background: white;' +
        '            padding: 30px;' +
        '            border-radius: 8px;' +
        '            box-shadow: 0 2px 4px rgba(0,0,0,0.1);' +
        '        }' +
        '        h2 { color: #333; margin-top: 0; }' +
        '        .upload-section {' +
        '            margin: 20px 0;' +
        '            padding: 20px;' +
        '            border: 2px dashed #ddd;' +
        '            border-radius: 4px;' +
        '            text-align: center;' +
        '        }' +
        '        input[type="file"] {' +
        '            margin: 10px 0;' +
        '        }' +
        '        button {' +
        '            background: #0066cc;' +
        '            color: white;' +
        '            border: none;' +
        '            padding: 12px 24px;' +
        '            border-radius: 4px;' +
        '            cursor: pointer;' +
        '            font-size: 16px;' +
        '            margin: 10px 5px;' +
        '        }' +
        '        button:hover { background: #0052a3; }' +
        '        button:disabled {' +
        '            background: #ccc;' +
        '            cursor: not-allowed;' +
        '        }' +
        '        .status {' +
        '            margin-top: 20px;' +
        '            padding: 15px;' +
        '            border-radius: 4px;' +
        '            display: none;' +
        '        }' +
        '        .status.info { background: #e3f2fd; color: #1565c0; display: block; }' +
        '        .status.success { background: #e8f5e9; color: #2e7d32; display: block; }' +
        '        .status.error { background: #ffebee; color: #c62828; display: block; }' +
        '        .status.processing { background: #fff3e0; color: #e65100; display: block; }' +
        '        .file-info {' +
        '            margin: 10px 0;' +
        '            padding: 10px;' +
        '            background: #f5f5f5;' +
        '            border-radius: 4px;' +
        '            display: none;' +
        '        }' +
        '        .instructions {' +
        '            background: #f9f9f9;' +
        '            padding: 15px;' +
        '            border-radius: 4px;' +
        '            margin-bottom: 20px;' +
        '        }' +
        '        .instructions h3 { margin-top: 0; font-size: 16px; }' +
        '        .instructions ul { margin: 10px 0; padding-left: 20px; }' +
        '        .instructions li { margin: 5px 0; }' +
        '        .results { margin-top: 20px; }' +
        '        .results-table {' +
        '            width: 100%;' +
        '            border-collapse: collapse;' +
        '            margin-top: 10px;' +
        '        }' +
        '        .results-table th, .results-table td {' +
        '            padding: 8px;' +
        '            text-align: left;' +
        '            border-bottom: 1px solid #ddd;' +
        '        }' +
        '        .results-table th { background: #f5f5f5; font-weight: 600; }' +
        '    </style>' +
        '</head>' +
        '<body>' +
        '    <div class="container">' +
        '        <h2>📊 CSV User Status Update</h2>' +
        '        ' +
        '        <div class="instructions">' +
        '            <h3>Instructions:</h3>' +
        '            <ul>' +
        '                <li>Upload a CSV file with email addresses</li>' +
        '                <li>The CSV should have a header row with an "email" or "mail" column</li>' +
        '                <li>Example format: <code>email,name</code> or just <code>email</code></li>' +
        '                <li>Users will be set to <strong>inactive</strong> status</li>' +
        '            </ul>' +
        '        </div>' +
        '        ' +
        '        <div class="upload-section">' +
        '            <p>📁 Select your CSV file</p>' +
        '            <input type="file" id="csvFile" accept=".csv,.txt" />' +
        '            <div class="file-info" id="fileInfo"></div>' +
        '            <div>' +
        '                <button id="uploadBtn" onclick="handleUpload()" disabled>Process CSV</button>' +
        '                <button onclick="resetForm()">Reset</button>' +
        '            </div>' +
        '        </div>' +
        '        ' +
        '        <div class="status" id="status"></div>' +
        '        <div class="results" id="results"></div>' +
        '    </div>' +
        '    ' +
        '    <script>' +
        '        let selectedFile = null;' +
        '        const baseUrl = "' + baseUrl + '";' +
        '        const sessionToken = "' + sessionToken + '";' +
        '        ' +
        '        document.getElementById("csvFile").addEventListener("change", function(e) {' +
        '            selectedFile = e.target.files[0];' +
        '            const fileInfo = document.getElementById("fileInfo");' +
        '            const uploadBtn = document.getElementById("uploadBtn");' +
        '            const status = document.getElementById("status");' +
        '            ' +
        '            if (!selectedFile) {' +
        '                fileInfo.style.display = "none";' +
        '                uploadBtn.disabled = true;' +
        '                return;' +
        '            }' +
        '            ' +
        '            // Validate file' +
        '            if (!selectedFile.name.match(/\\.(csv|txt)$/i)) {' +
        '                status.className = "status error";' +
        '                status.innerHTML = "❌ Please select a CSV file (.csv or .txt)";' +
        '                uploadBtn.disabled = true;' +
        '                fileInfo.style.display = "none";' +
        '                return;' +
        '            }' +
        '            ' +
        '            // Show file info' +
        '            fileInfo.style.display = "block";' +
        '            fileInfo.innerHTML = ' +
        '                `<strong>Selected:</strong> ${selectedFile.name}<br>` +' +
        '                `<strong>Size:</strong> ${(selectedFile.size / 1024).toFixed(2)} KB`;' +
        '            ' +
        '            uploadBtn.disabled = false;' +
        '            status.style.display = "none";' +
        '        });' +
        '        ' +
        '        function resetForm() {' +
        '            document.getElementById("csvFile").value = "";' +
        '            document.getElementById("fileInfo").style.display = "none";' +
        '            document.getElementById("uploadBtn").disabled = true;' +
        '            document.getElementById("status").style.display = "none";' +
        '            document.getElementById("results").innerHTML = "";' +
        '            selectedFile = null;' +
        '        }' +
        '        ' +
        '        function handleUpload() {' +
        '            if (!selectedFile) {' +
        '                alert("Please select a file first");' +
        '                return;' +
        '            }' +
        '            ' +
        '            const status = document.getElementById("status");' +
        '            const uploadBtn = document.getElementById("uploadBtn");' +
        '            ' +
        '            status.className = "status processing";' +
        '            status.innerHTML = "⏳ Reading file...";' +
        '            uploadBtn.disabled = true;' +
        '            ' +
        '            const reader = new FileReader();' +
        '            ' +
        '            reader.onload = function(e) {' +
        '                const csvContent = e.target.result;' +
        '                const csvData = btoa(unescape(encodeURIComponent(csvContent)));' +
        '                ' +
        '                status.innerHTML = "⏳ Processing users...";' +
        '                ' +
        '                // Send to processing endpoint' +
        '                fetch(baseUrl + "/openidm/endpoint/processCsv", {' +
        '                    method: "POST",' +
        '                    headers: {' +
        '                        "Content-Type": "application/json",' +
        '                        "X-OpenIDM-Username": "openidm-admin",' +
        '                        "X-OpenIDM-Password": "openidm-admin"' +
        '                    },' +
        '                    body: JSON.stringify({' +
        '                        csvData: csvData,' +
        '                        sessionToken: sessionToken' +
        '                    })' +
        '                })' +
        '                .then(response => response.json())' +
        '                .then(result => {' +
        '                    if (result.success) {' +
        '                        status.className = "status success";' +
        '                        status.innerHTML = `✅ Success! Processed ${result.processed} users (${result.updated} updated, ${result.notFound} not found)`;' +
        '                        ' +
        '                        // Show detailed results' +
        '                        if (result.details && result.details.length > 0) {' +
        '                            displayResults(result.details);' +
        '                        }' +
        '                    } else {' +
        '                        status.className = "status error";' +
        '                        status.innerHTML = "❌ Error: " + (result.message || "Unknown error");' +
        '                    }' +
        '                    uploadBtn.disabled = false;' +
        '                })' +
        '                .catch(error => {' +
        '                    status.className = "status error";' +
        '                    status.innerHTML = "❌ Error: " + error.message;' +
        '                    uploadBtn.disabled = false;' +
        '                    console.error("Error:", error);' +
        '                });' +
        '            };' +
        '            ' +
        '            reader.onerror = function() {' +
        '                status.className = "status error";' +
        '                status.innerHTML = "❌ Failed to read file";' +
        '                uploadBtn.disabled = false;' +
        '            };' +
        '            ' +
        '            reader.readAsText(selectedFile);' +
        '        }' +
        '        ' +
        '        function displayResults(details) {' +
        '            const resultsDiv = document.getElementById("results");' +
        '            let html = "<h3>Detailed Results:</h3>";' +
        '            html += \'<table class="results-table">\';' +
        '            html += "<thead><tr><th>Email</th><th>Status</th></tr></thead><tbody>";' +
        '            ' +
        '            details.forEach(detail => {' +
        '                const statusIcon = detail.success ? "✅" : "❌";' +
        '                html += `<tr><td>${detail.email}</td><td>${statusIcon} ${detail.message}</td></tr>`;' +
        '            });' +
        '            ' +
        '            html += "</tbody></table>";' +
        '            resultsDiv.innerHTML = html;' +
        '        }' +
        '    </script>' +
        '</body>' +
        '</html>';
    
    return {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=UTF-8"
        },
        body: html
    };
}());
