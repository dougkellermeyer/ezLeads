
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
        let websiteLink = Array.from(card.querySelectorAll('a')).find(a => a.href.includes('website'));
        let mapsLink = Array.from(card.querySelectorAll('a')).find(a => a.href.includes('/maps/place/'));
        let website = websiteLink ? websiteLink.href : "";
        let mapsUrl = mapsLink ? mapsLink.href : "";
        let address = card.querySelector('[data-item-id="address"]')?.textContent || "";
        let phone = card.querySelector('[data-tooltip="Copy phone number"]')?.textContent || "";

        if (!website) {
            leads.push({ name, address, phone, mapsUrl });
        }
    });

    if (leads.length > 0) {
        const csv = "Name,Address,Phone,MapsURL\n" + leads.map(l => 
            [l.name, l.address, l.phone, l.mapsUrl].map(x => `"\${x}"`).join(",")
        ).join("\n");

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
