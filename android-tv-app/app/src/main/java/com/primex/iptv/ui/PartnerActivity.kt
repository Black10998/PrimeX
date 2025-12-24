package com.primex.iptv.ui

import android.os.Bundle
import android.widget.TextView
import com.primex.iptv.R

class PartnerActivity : BaseActivity() {

    private lateinit var referralCodeText: TextView
    private lateinit var totalReferralsText: TextView
    private lateinit var earningsText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_partner)

        initViews()
        loadPartnerData()
    }

    private fun initViews() {
        referralCodeText = findViewById(R.id.referral_code_text)
        totalReferralsText = findViewById(R.id.total_referrals_text)
        earningsText = findViewById(R.id.earnings_text)
    }

    private fun loadPartnerData() {
        // Generate referral code based on username
        val username = com.primex.iptv.utils.PreferenceManager.getXtreamUsername(this) ?: "USER"
        val referralCode = generateReferralCode(username)
        
        referralCodeText.text = referralCode
        totalReferralsText.text = "0"
        earningsText.text = "$0.00"
    }

    private fun generateReferralCode(username: String): String {
        val hash = username.hashCode().toString().takeLast(6)
        return "PRIME-$hash"
    }
}
