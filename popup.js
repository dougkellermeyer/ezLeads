
document.getElementById("scrapeBtn").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: scrapeGoogleMapsLeads,
    });
    document.getElementById("status").textContent = "Scraping... check downloads";
});

function scrapeGoogleMapsLeads() {
    let cards = document.querySelectorAll('[role="article"]');
    let leads = [];

    cards.forEach(card => {
        let name = card.querySelector('h3')?.textContent || "";
        let address = "";
        let phone = "";
        let mapsUrl = "";

        // Find all buttons/icons
        let links = card.querySelectorAll('a');

        let hasWebsite = false;
        let possibleWebsite = "";

        links.forEach(link => {
            if (link.innerText.toLowerCase().includes("website") || link.getAttribute("aria-label")?.toLowerCase().includes("website")) {
                hasWebsite = true;
                possibleWebsite = link.href;
            }

            if (link.href.includes("/maps/place/")) {
                mapsUrl = link.href;
            }
        });

        // Grab address and phone if available
        const spans = card.querySelectorAll("span");
        spans.forEach(span => {
            if (span.textContent.match(/\\d{3}[\\)\\-\\s]?\\d{3}[\\-\\s]?\\d{4}/)) {
                phone = span.textContent;
            } else if (span.textContent.length > 10 && span.textContent.includes(",")) {
                address = span.textContent;
            }
        });

        if (!hasWebsite) {
            leads.push({ name, address, phone, mapsUrl });
        }
    });

    if (leads.length > 0) {
        const csv = "Name,Address,Phone,MapsURL\\n" + leads.map(l => 
            [l.name, l.address, l.phone, l.mapsUrl].map(x => `"\${x}"`).join(",")
        ).join("\\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "leads_no_website.csv";
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert("No leads without websites found.");
    }
}
