import React, { useEffect, useState } from 'react'

function Bilty({ pData }) {

    const [formData, setFormData] = useState({
        userEmail: '',
        companyName: '',
        number: '',
        address: '',
        headOfficeAddress: '',
        gstin: '',
        sapCode: ''
    });



    useEffect(() => {
        console.log(pData.Packages)
        const getData = localStorage.getItem('transportUser')
        console.log(JSON.parse(getData))
        const data = JSON.parse(getData)
        console.log(data)
        setFormData({
            userEmail: data.email,
            companyName: data.companyName,
            number: data.number,
            address: data.address,
            headOfficeAddress: data.headOfficeAddress,
            gstin: data.gstinNo,
            sapCode: data.sapCode
        });
    }, [])


    return (
        <div className="invoice-box   text-xs">
            <table className="main-table">
                <tbody>
                    <tr>
                        <td rowSpan="3" style={{ width: '20%', textAlign: 'center' }}>
                            <div className="spiritual-logo">
                                <img
                                    height={100}
                                    src="https://res.cloudinary.com/dfqsa6hoc/image/upload/v1774593897/truck-logo-vector-45757689_qmids4.png" alt="logo" />
                            </div>
                            <div className="email-text   ">Email: <br /><span className=' lowercase'>{formData.userEmail}</span></div>
                        </td>
                        <td colSpan="4">
                            <div className="sub-header">All subject to Jurisdiction only</div>
                            <h1 className="header-title ">{formData.companyName}</h1>
                            <div className="bold-center">Authorised Transporter for - <span className="">ULTRATECH CEMENT LTD.</span></div>
                            <div className="address-text">
                                Add.: {formData.address}<br />
                                Head Office : {formData.headOfficeAddress}
                            </div>
                        </td>
                        <td colSpan="2" className="driver-info">
                            Driver Name:...........<br />
                            Mob. No:...............<br />
                            Mob : {formData.number}<br />
                            GSTIN : {formData.gstin}<br />
                            <b style={{ fontSize: '13px' }}>SAP Code No-{formData.sapCode}</b>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan="2" className="hindi-note" style={{ width: '35%' }}>
                            <b>DECLARATION</b><br />
                            We hereby declare that Input Tax Credit of Capital Goods and input Services, used for providing transportation services, has not been taken by us.
                        </td>
                        <td colSpan="1">Party/STO Order No. <br /><b>{pData.DONo}</b></td>
                        <td colSpan="1">Date <br /><b>{pData.DateOfIssueOfInvoice}</b></td>
                        <td colSpan="2"><b>L.R. No.</b> <br /><b>{pData.LRNO}</b></td>
                    </tr>

                    <tr>
                        <td colSpan="2">
                            <b style={{ fontSize: '12px' }}>ULTRATECH CEMENT LIMITED</b><br />
                            (UNIT : KOTPUTLI CEMENT WORKS)<br />
                            Village- Mohanpura, Tehsil- Kotputli<br />
                            Distt - Jaipur (Raj.) 303108<br />
                            GST: 08AAACL6442L1ZA
                        </td>
                        <td>From: <br /><b>KOTPUTLI</b></td>
                        <td colSpan="3">TO - <br /><b>{pData.Destination}</b></td>
                    </tr>

                    <tr>
                        <td colSpan="2" style={{ height: '40px' }}>
                            <table className="inner-table">
                                <tbody>
                                    <tr><td style={{ border: 'none' }}>Fright Details</td><td style={{ border: 'none' }}>Invoice Value</td></tr>
                                    <tr><td style={{ border: 'none' }}><b>TO BE BILLED</b></td><td style={{ border: 'none' }}>RS. <b>{pData.TotalInvoiceValue}</b></td></tr>
                                </tbody>
                            </table>
                        </td>
                        <td colSpan="5" className="bold-center consignee-cell">
                            CONSIGNEE <br /> <span className="underline-text">{pData.NameOfRecipient}</span>
                        </td>
                    </tr>

                    <tr>
                        <td rowSpan="4" colSpan="2" className="hindi-note">
                            Acknowledgement Consignee with Signature & Stamp
                        </td>
                        <td colSpan="2">GST NO.: <b>{pData.GSTINNo}</b></td>
                        <td colSpan="3">Vehicle No.: <b style={{ fontSize: '14px' }}>{pData.VehicleNo}</b></td>
                    </tr>
                    <tr>
                        <td colSpan="2">SAP Delivery No.: <b>{pData.DINo}</b></td>
                        <td colSpan="3" rowSpan="2"></td>
                    </tr>
                    <tr>
                        <td colSpan="2">Invoice No.: <b>{pData.InvoiceNo}</b></td>
                    </tr>
                    <tr>
                        <td>PRODUCT</td>
                        <td>QUANTITY (M.T.)</td>
                        <td colSpan="3">Bags/Loose</td>
                    </tr>

                    <tr>
                        <td colSpan="2" rowSpan="2" className="hindi-note">
                            नोट- 1. बिल्टी की पहुँच 15 दिन के अन्दर की जाये, अन्यथा किराये का 2% काटा जावेगा और एक माह के बाद पहुँच का किराया नहीं दिया जावेगा।<br />
                            2. गाड़ी में रस्सा तिरपाल अनिवार्य है अन्यथा गाड़ी नहीं भरी जाएगी।
                        </td>
                        <td className="bold-center">CEMENT</td>
                        <td className="bold-center" style={{ fontSize: '16px' }}>{pData.Quantity}</td>
                        <td colSpan="3" className="bold-center" style={{ fontSize: '16px' }}>{pData.Packages}</td>
                    </tr>
                    <tr>
                        <td>GRADE : 43/53/PPC</td>
                        <td></td>
                        <td colSpan="3"></td>
                    </tr>

                    <tr className="signature-row">
                        <td colSpan="2">Sign. of Customer</td>
                        <td colSpan="2" style={{ textAlign: 'center' }}>Sign. of Driver</td>
                        <td colSpan="3" style={{ textAlign: 'right' }}>
                            Sign. of Goods Clerk<br /><b>For SAWARIYA LOGISTIC</b>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Bilty