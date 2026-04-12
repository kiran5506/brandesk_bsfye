const mongoose = require('mongoose');
const Freelancer = require('../models/freelancerModel');
const Service = require('../models/serviceModel');
const City = require('../models/cityModel');
const Skill = require('../models/skillModel');
const Language = require('../models/languageModel');
const baseUrl = process.env.BASE_URL;

const parseList = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => item.toString());
    }
    if (!value) {
        return [];
    }
    return value
        .toString()
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const buildFileUrls = (files = []) => {
    if (!baseUrl) {
        return files;
    }
    return files.map((fileName) => `${baseUrl}${fileName}`);
};

const buildFileUrl = (fileName = '') => {
    if (!fileName) {
        return '';
    }
    if (!baseUrl) {
        return fileName;
    }
    return `${baseUrl}${fileName}`;
};

const buildServiceMap = async (serviceIds = []) => {
    const uniqueServiceIds = [...new Set(serviceIds.map((id) => id.toString()))];
    const services = uniqueServiceIds.length
        ? await Service.find({ _id: { $in: uniqueServiceIds } }).select('serviceName')
        : [];

    return services.reduce((acc, service) => {
        acc[service._id.toString()] = service.serviceName;
        return acc;
    }, {});
};

const buildCityMap = async () => {
    const cities = await City.find({}).select('cityName');
    return cities.reduce((acc, city) => {
        acc[city._id.toString()] = city.cityName;
        return acc;
    }, {});
};

const buildSkillMap = async (skillIds = []) => {
    const uniqueSkillIds = [...new Set(skillIds.map((id) => id.toString()))];
    const skills = uniqueSkillIds.length
        ? await Skill.find({ _id: { $in: uniqueSkillIds } }).select('skillName')
        : [];

    return skills.reduce((acc, skill) => {
        acc[skill._id.toString()] = skill.skillName;
        return acc;
    }, {});
};

const buildLanguageMap = async (languageIds = []) => {
    const uniqueLanguageIds = [...new Set(languageIds.map((id) => id.toString()))];
    const languages = uniqueLanguageIds.length
        ? await Language.find({ _id: { $in: uniqueLanguageIds } }).select('languageName')
        : [];

    return languages.reduce((acc, language) => {
        acc[language._id.toString()] = language.languageName;
        return acc;
    }, {});
};

exports.create = async (req, res) => {
    try {
        const files = req.files || {};
        const { name, mobile, email, city, services, skills, languages } = req.body;

        if (!name || !mobile || !email || !city) {
            return res.status(400).json({
                status: false,
                message: 'Required fields are missing (name, mobile, email, city).'
            });
        }

        const servicesArray = parseList(services);
        const skillsArray = parseList(skills);
        const languagesArray = parseList(languages);

        if (!servicesArray.length || !skillsArray.length || !languagesArray.length) {
            return res.status(400).json({
                status: false,
                message: 'Services, skills, and languages are required.'
            });
        }

        const profileImage = files.profile ? files.profile[0].filename : '';
        if (!profileImage) {
            return res.status(400).json({
                status: false,
                message: 'Profile image is required.'
            });
        }

        const imageFiles = files.images ? files.images.map((file) => file.filename) : [];
        if (!imageFiles.length) {
            return res.status(400).json({
                status: false,
                message: 'At least one image is required.'
            });
        }

        const videoFiles = files.videos ? files.videos.map((file) => file.filename) : [];

        const newFreelancer = new Freelancer({
            name,
            mobile,
            email,
            profileImage,
            city,
            services: servicesArray,
            skills: skillsArray,
            languages: languagesArray,
            images: imageFiles,
            videos: videoFiles
        });

        const result = await newFreelancer.save();

        res.status(201).json({
            status: true,
            message: 'Freelancer profile created successfully.',
            data: {
                ...result.toObject(),
                profileImage: buildFileUrl(result.profileImage),
                images: buildFileUrls(result.images),
                videos: buildFileUrls(result.videos)
            }
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: `An error occurred: ${err.message}`
        });
    }
};

exports.list = async (req, res) => {
    try {
        const { q, name, city, skills, type } = req.query;
        const filter = {};

        if (q) {
            const searchText = q.toString().trim();
            const orFilters = [{ name: { $regex: searchText, $options: 'i' } }];

            if (mongoose.Types.ObjectId.isValid(searchText)) {
                orFilters.push({ city: searchText });
                orFilters.push({ skills: { $in: [searchText] } });
                orFilters.push({ services: { $in: [searchText] } });
            }

            const [matchedCities, matchedSkills, matchedServices] = await Promise.all([
                City.find({ cityName: { $regex: searchText, $options: 'i' } }).select('_id'),
                Skill.find({ skillName: { $regex: searchText, $options: 'i' } }).select('_id'),
                Service.find({ serviceName: { $regex: searchText, $options: 'i' } }).select('_id')
            ]);

            if (matchedCities.length) {
                orFilters.push({ city: { $in: matchedCities.map((cityDoc) => cityDoc._id) } });
            }

            if (matchedSkills.length) {
                orFilters.push({ skills: { $in: matchedSkills.map((skillDoc) => skillDoc._id) } });
            }

            if (matchedServices.length) {
                orFilters.push({ services: { $in: matchedServices.map((serviceDoc) => serviceDoc._id) } });
            }

            const freelancers = await Freelancer.find({ $or: orFilters }).sort({ createdAt: -1 });
            if (!freelancers || freelancers.length === 0) {
                return res.status(200).json({
                    status: true,
                    message: 'No freelancer profiles found.',
                    data: []
                });
            }

            const serviceIds = freelancers
                .flatMap((freelancer) => freelancer.services || [])
                .filter(Boolean);
            const skillIds = freelancers
                .flatMap((freelancer) => freelancer.skills || [])
                .filter(Boolean);
            const languageIds = freelancers
                .flatMap((freelancer) => freelancer.languages || [])
                .filter(Boolean);

            const [serviceMap, cityMap, skillMap, languageMap] = await Promise.all([
                buildServiceMap(serviceIds),
                buildCityMap(),
                buildSkillMap(skillIds),
                buildLanguageMap(languageIds)
            ]);

            const results = freelancers.map((freelancer) => ({
                ...freelancer.toObject(),
                services: (freelancer.services || []).map(
                    (serviceId) => serviceMap[serviceId?.toString?.()] || serviceId
                ),
                skills: (freelancer.skills || []).map(
                    (skillId) => skillMap[skillId?.toString?.()] || skillId
                ),
                languages: (freelancer.languages || []).map(
                    (languageId) => languageMap[languageId?.toString?.()] || languageId
                ),
                city: cityMap[freelancer.city?.toString?.()] || freelancer.city,
                profileImage: buildFileUrl(freelancer.profileImage),
                images: buildFileUrls(freelancer.images),
                videos: buildFileUrls(freelancer.videos)
            }));

            return res.status(200).json({
                status: true,
                message: 'Freelancer profiles list.',
                data: results
            });
        }

        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        if (city) {
            if (mongoose.Types.ObjectId.isValid(city)) {
                filter.city = city;
            } else {
                const matchedCity = await City.findOne({
                    cityName: { $regex: `^${city}$`, $options: 'i' }
                }).select('_id');
                if (!matchedCity) {
                    return res.status(200).json({
                        status: true,
                        message: 'No freelancer profiles found.',
                        data: []
                    });
                }
                filter.city = matchedCity._id;
            }
        }

        if (skills) {
            const skillList = parseList(skills);
            const skillIds = skillList.filter((item) => mongoose.Types.ObjectId.isValid(item));
            const skillNames = skillList.filter((item) => !mongoose.Types.ObjectId.isValid(item));

            const matchedSkills = skillNames.length
                ? await Skill.find({
                    $or: skillNames.map((skillName) => ({
                        skillName: { $regex: `^${skillName}$`, $options: 'i' }
                    }))
                }).select('_id')
                : [];

            const resolvedSkillIds = [
                ...skillIds,
                ...matchedSkills.map((skill) => skill._id.toString())
            ];

            if (!resolvedSkillIds.length) {
                return res.status(200).json({
                    status: true,
                    message: 'No freelancer profiles found.',
                    data: []
                });
            }

            filter.skills = { $in: resolvedSkillIds };
        }

        if (type) {
            const typeList = parseList(type);
            const serviceIds = typeList.filter((item) => mongoose.Types.ObjectId.isValid(item));
            const serviceNames = typeList.filter((item) => !mongoose.Types.ObjectId.isValid(item));

            const matchedServices = serviceNames.length
                ? await Service.find({
                    $or: serviceNames.map((serviceName) => ({
                        serviceName: { $regex: `^${serviceName}$`, $options: 'i' }
                    }))
                }).select('_id')
                : [];

            const resolvedServiceIds = [
                ...serviceIds,
                ...matchedServices.map((service) => service._id.toString())
            ];

            if (!resolvedServiceIds.length) {
                return res.status(200).json({
                    status: true,
                    message: 'No freelancer profiles found.',
                    data: []
                });
            }

            filter.services = { $in: resolvedServiceIds };
        }

        const freelancers = await Freelancer.find(filter).sort({ createdAt: -1 });
        if (!freelancers || freelancers.length === 0) {
            return res.status(200).json({
                status: true,
                message: 'No freelancer profiles found.',
                data: []
            });
        }

        const serviceIds = freelancers
            .flatMap((freelancer) => freelancer.services || [])
            .filter(Boolean);
        const skillIds = freelancers
            .flatMap((freelancer) => freelancer.skills || [])
            .filter(Boolean);
        const languageIds = freelancers
            .flatMap((freelancer) => freelancer.languages || [])
            .filter(Boolean);

        const [serviceMap, cityMap, skillMap, languageMap] = await Promise.all([
            buildServiceMap(serviceIds),
            buildCityMap(),
            buildSkillMap(skillIds),
            buildLanguageMap(languageIds)
        ]);

        const results = freelancers.map((freelancer) => ({
            ...freelancer.toObject(),
            services: (freelancer.services || []).map(
                (serviceId) => serviceMap[serviceId?.toString?.()] || serviceId
            ),
            skills: (freelancer.skills || []).map(
                (skillId) => skillMap[skillId?.toString?.()] || skillId
            ),
            languages: (freelancer.languages || []).map(
                (languageId) => languageMap[languageId?.toString?.()] || languageId
            ),
            city: cityMap[freelancer.city?.toString?.()] || freelancer.city,
            profileImage: buildFileUrl(freelancer.profileImage),
            images: buildFileUrls(freelancer.images),
            videos: buildFileUrls(freelancer.videos)
        }));

        res.status(200).json({
            status: true,
            message: 'Freelancer profiles list.',
            data: results
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: `An error occurred: ${err.message}`
        });
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;
        const freelancer = await Freelancer.findById(id);

        if (!freelancer) {
            return res.status(404).json({
                status: false,
                message: 'Freelancer profile not found.'
            });
        }

        const [serviceMap, cityMap, skillMap, languageMap] = await Promise.all([
            buildServiceMap(freelancer.services || []),
            buildCityMap(),
            buildSkillMap(freelancer.skills || []),
            buildLanguageMap(freelancer.languages || [])
        ]);

        const result = {
            ...freelancer.toObject(),
            services: (freelancer.services || []).map(
                (serviceId) => serviceMap[serviceId?.toString?.()] || serviceId
            ),
            skills: (freelancer.skills || []).map(
                (skillId) => skillMap[skillId?.toString?.()] || skillId
            ),
            languages: (freelancer.languages || []).map(
                (languageId) => languageMap[languageId?.toString?.()] || languageId
            ),
            city: cityMap[freelancer.city?.toString?.()] || freelancer.city,
            profileImage: buildFileUrl(freelancer.profileImage),
            images: buildFileUrls(freelancer.images),
            videos: buildFileUrls(freelancer.videos)
        };

        res.status(200).json({
            status: true,
            message: 'Freelancer profile details.',
            data: result
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: `An error occurred: ${err.message}`
        });
    }
};
