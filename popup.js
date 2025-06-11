// popup.js

document.getElementById("scrapeBtn").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeGoogleMapsLeads,
    });
    document.getElementById("status").textContent = "Scraping... check console & downloads";
});

function scrapeGoogleMapsLeads() {
    console.log("Scrape function started");

    function waitFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function collectLeads() {
        await waitFor(1000);

        const cards = document.querySelectorAll('div[jscontroller="AtSb"]');
        console.log(`Found ${cards.length} cards`);

        let leads = [];

        cards.forEach((card, index) => {
            console.log(`\n--- Parsing card #${index + 1} ---`);

            const nameSpan = card.querySelector('span.OSrXXb, h3 span');
            const name = nameSpan ? nameSpan.textContent.trim() : "NO NAME";
            let phone = "";
            let hasWebsite = false;
            
            const websiteAnchor = Array.from(card.querySelectorAll("a")).find(a => {
                const href = a.href || "";
                return href.startsWith("http") && !href.includes("google.com/maps") && !href.includes("voice.google.com");
            });
            console.log("Website anchor found:", websiteAnchor);
            if (websiteAnchor) {
                hasWebsite = true;
                console.log("✅ Website link found:", websiteAnchor.href);
            }


            // 🔍 Try to get phone via tel: links first
            const links = card.querySelectorAll("a");
            links.forEach(link => {
                const href = link.getAttribute("href") || "";
                if (!phone && href.startsWith("tel:")) {
                    phone = href.replace("tel:", "").trim();
                }
            });

            // 📦 Backup phone search via text pattern
            if (!phone) {
                const textBlocks = Array.from(card.querySelectorAll("span, div"))
                    .map(el => el.textContent.trim())
                    .filter(Boolean);

                for (const text of textBlocks) {
                    const match = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                    if (match) {
                        phone = match[0];
                        break;
                    }
                }
            }

            console.log("Name:", name);
            console.log("Phone:", phone);
            console.log("Website present?", hasWebsite);

            if (!hasWebsite && phone) {
                console.log("✅ Adding lead (no website)");
                leads.push({ name, phone });
            }
        });

        console.log(`\nTotal leads without website: ${leads.length}`);

        if (leads.length > 0) {
            const csv = "Name,Phone\n" + leads.map(l =>
                [l.name, l.phone].map(x => `"${x.replace(/"/g, '""')}"`).join(",")
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

    collectLeads();
}
