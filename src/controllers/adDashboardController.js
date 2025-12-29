const Settings = require("../models/settingsModule");
const baseUrl = process.env.BASE_URL;

exports.siteSettings = async (req, res) => {
    const id = req.params.id;
    const { page_title, mobile_number, email, whatsapp_number, address, why_bsfye, youtube_url, linkdin_url, google_analytics, facebook_url, twitter_url, instagram_url } = req.body;
    const files = req.files;

    console.log("Files received:", req.files);
    console.log("Body received:", req.body);
    try {
        let logo = "",
            footer_logo = "",
            favicon = "";

        if (files && files.logo && files.logo[0]) {
            logo = files.logo[0].filename;
        }
        if (files && files.footer_logo && files.footer_logo[0]) {
            footer_logo = files.footer_logo[0].filename;
        }
        if (files && files.favicon && files.favicon[0]) {
            favicon = files.favicon[0].filename;
        }

        const payload = {
            ...(logo && { logo }),
            ...(footer_logo && { footer_logo }),
            ...(favicon && { favicon }),
            ...(page_title && { page_title }),
            ...(mobile_number && { mobile_number }),
            ...(email && { email }),
            ...(whatsapp_number && { whatsapp_number }),
            ...(address && { address }),
            ...(why_bsfye && { why_bsfye }),
            ...(google_analytics && { google_analytics }),
            ...(facebook_url && { facebook_url }),
            ...(twitter_url && { twitter_url }),
            ...(instagram_url && { instagram_url }),
            ...(youtube_url && { youtube_url }),
            ...(linkdin_url && { linkdin_url }),
        };

        // Remove undefined fields (prevents overwrite)
        Object.keys(payload).forEach(
            key => payload[key] === undefined && delete payload[key]
        );

        // Update site settings in the database
        const updatedSettings = await Settings.findByIdAndUpdate(
            id,
            payload,
            { new: true, runValidators: true }
        );
        if (!updatedSettings) {
            return res.status(404).json({
                success: false,
                message: "Settings not found",
            });
        }
            
        res.status(200).json({ status: true, message: "Site settings updated successfully", data: updatedSettings });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.getSiteSettings = async (req, res) => {
    const id = req.params.id;
    try {
        const settings = await Settings.findOne({ _id: id }).select('-__v -createdAt -updatedAt -_id');
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "Settings not found",
            });
        }
        if(settings.logo){
            settings.logo = baseUrl + settings.logo;
        }
        if(settings.footer_logo){
            settings.footer_logo = baseUrl + settings.footer_logo;
        }
        if(settings.favicon){
            settings.favicon = baseUrl + settings.favicon;
        }

        res.status(200).json({ status: true, data: settings });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}
