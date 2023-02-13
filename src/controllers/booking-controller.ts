import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response){
    try{
        const { userId } = req;
        const booking = await bookingService.getBooking(userId);

        return res.status(httpStatus.OK).send({
            id: booking.id,
            Room: booking.Room
        });
    } catch (error) {
        return res.sendStatus(httpStatus.NOT_FOUND)
    }
}