const Slider = require('../models/sliderModel'); 
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { bannerDesktop, bannerMobile, linkTitle, linkUrl } = req.body;
    try{
        let banner_desktop = "";
        let banner_mobile = "";
        if(files){
            banner_desktop = files.bannerDesktop ? files.bannerDesktop[0].filename : "";
            banner_mobile = files.bannerMobile ? files.bannerMobile[0].filename : "";
        }
        const newSlider = new Slider({bannerDesktop: banner_desktop, bannerMobile:banner_mobile, linkTitle, linkUrl});
        const result = await newSlider.save();
        res.status(201).json({status: true, message: 'Slider created Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    } 
}

exports.edit = async (req, res) => {    
    const files = req.files;
    const { id } = req.params;
    const { linkTitle, linkUrl } = req.body;
    try{
        let banner_desktop = "";
        let banner_mobile = "";

        const slider = await Slider.findOne({_id: id});
        if(!slider){
            return res.status(404).json({ status: false, message: "Sliderdata not found" });
        }
        if(files){
            banner_desktop = files.bannerDesktop ? files.bannerDesktop[0].filename : slider.bannerDesktop;
            banner_mobile = files.bannerMobile ? files.bannerMobile[0].filename : slider.bannerMobile;
        }else{
            banner_desktop = slider.bannerDesktop;
            banner_mobile = slider.bannerMobile;
        }
        const result = await Slider.findByIdAndUpdate(id, {bannerDesktop: banner_desktop, bannerMobile:banner_mobile, linkTitle, linkUrl}, { new: true, runValidators: true });
        console.log(result);
        
        res.status(201).json({status: true, message: 'Slider updated Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.delete = async (req, res) => {
    const { id } = req.params;
    const { linkTitle, linkUrl } = req.body;
    try{
        const slider = await Slider.findOne({_id: id});
        if(!slider){
            return res.status(404).json({ status: false, message: "Sliderdata not found" });
        }
        const result = await Slider.findByIdAndDelete(id, { new: true, runValidators: true });
        res.status(201).json({status: true, message: 'Slider Deleted Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}   

exports.list = async (req, res) => {
    try{
        const sliders = await Slider.find();
        if (!sliders || sliders.length === 0) {
            return res.status(404).json({ status: false, message: "No banners found" });
        }

        const banners = sliders.map(slider => {
            return {
                _id: slider._id,
                linkTitle: slider.linkTitle,
                linkUrl: slider.linkUrl,
                bannerDesktopPath: baseUrl + slider.bannerDesktop,
                bannerMobilePath: baseUrl + slider.bannerMobile
            };
        });

        res.status(201).json({status: true, message: 'Sliders list.', data: banners})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.findById = async (req, res) => {
    const { id } = req.params;
    try{
        const slider = await Slider.findById(id);
        if(!slider){
            return res.status(404).json({ status: false, message: "Sliderdata not found" });
        }
        if(slider){
            if(slider.bannerDesktop){
                slider.bannerDesktop  = baseUrl + slider.bannerDesktop;
            }
            if(slider.bannerMobile){
                slider.bannerMobile  = baseUrl + slider.bannerMobile;
            }
        } 
        res.status(201).json({status: true, message: 'slider data', data: slider})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}