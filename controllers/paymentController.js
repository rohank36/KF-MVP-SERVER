const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createSubscription = catchAsync(async (req, res, next) => {
  try {
    const user = req.user;

    //Create stripe customer
    const customer = await stripe.customers.create({
      name: user.fullName,
      email: user.email,
    });

    //Attach payment method to customer
    await stripe.paymentMethods.attach(req.body.paymentMethod, {
      customer: customer.id,
    });

    //Update the customer to set default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: req.body.paymentMethod,
      },
    });

    //get price id from client-side
    const priceId = req.body.priceId;

    //create stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_options: {
          card: {
            request_three_d_secure: "any",
          },
        },
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent"],
    });

    res.status(200).json({
      status: "success",
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error(err);
    return next(new AppError("Failed to create subscription", 500));
  }
});
