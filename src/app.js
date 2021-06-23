const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const { id } = req.params
    const profile_id = req.get('profile_id');
    const { Contract } = req.app.get('models')
    const profileType = req.profile.type;

    const user = {
        client: {
            id,
            ClientId: {
                [Op.eq]: profile_id
            }
        },
        contractor: {
            id,
            ContractorId: {
                [Op.eq]: profile_id
            }
        }
    }
    const contract = await Contract.findOne({
        where: user[profileType]
    })
    if (!contract) return res.status(404).end()
    res.json(contract)
})
app.get('/contracts', getProfile, async (req, res) => {

    const { Contract } = req.app.get('models')
    const { id, type } = req.profile;

    const user = {
        client: {
            status: { [Op.ne]: 'terminated' },
            ClientId: {
                [Op.eq]: id
            }
        },
        contractor: {
            status: { [Op.ne]: 'terminated' },
            ContractorId: {
                [Op.eq]: id
            }
        }
    }
    const contracts = await Contract.findAll({
        where: user[type]
    })
    if (!contracts || !Array.isArray(contracts) || contracts.length === 0) return res.status(404).end()
    res.json(contracts)
})
app.get('/jobs/unpaid', getProfile, async (req, res) => {

    const { Job, Contract } = req.app.get('models')
    const { id, type } = req.profile;
    if (type === 'contractor') return res.status(404).end()
    const user = {
        client: {
            status: { [Op.eq]: 'in_progress' },
            ClientId: {
                [Op.eq]: id
            }
        },
        contractor: {
            status: { [Op.eq]: 'in_progress' },
            ContractorId: {
                [Op.eq]: id
            }
        }
    }
    const jobs = await Job.findAll({
        include: [{
            model: Contract,
            on: { '$Contract.id$': { [Op.col]: 'Job.ContractId' } },
            where: user[type],
        }],
        where: { paid: { [Op.eq]: false } },
    })
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return res.status(404).end()
    res.json(jobs)
})

app.get('/admin/best-profession', getProfile, async (req, res) => {
    const { Job, Contract } = req.app.get('models')
    const { start, end } = req.query;
  if(!start || !end)return res.status(404).end();

  const totalAmount = await Profile.findAll({
    attributes: [
      'profession',
      [sequelize.fn('sum', sequelize.col('amount')), 'total_amount'],
    ],
    group: ['member_id'],
  });
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return res.status(404).end()
    res.json(jobs)
})
// app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
//     const { job_id } = req.params
//     const { Job, Contract } = req.app.get('models')
//     const { id, type } = req.profile;
//     if (type === 'contractor') return res.status(403).end()
//    Job.findOne({ 
//         include: [{
//         model: Profile,
//         on: { '$Profile.id$': { [Op.col]: id } },
//         where: { balance: { [Op.gte]: '$Job.price$'}},
//     }],
//     where: { ContractId: { [Op.eq]: job_id } } })
//         .on('success', function (job) {
//             if (job) {
//                 job.update({
//                     paid: true
//                 })
           
//             }
//         })
    
//     if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return res.status(404).end()
//     res.json(jobs)
// })

module.exports = app;
