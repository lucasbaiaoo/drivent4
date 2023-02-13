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

export async function postBooking(req: AuthenticatedRequest, res: Response){
    try{
        const { userId } = req;
        const { roomId } = req.body;

        if(!roomId){
            return res.sendStatus(httpStatus.BAD_REQUEST)
        }

        const booking = await bookingService.postBookingRoom(userId, Number(roomId))

        return res.status(httpStatus.OK).send({
            bookingId: booking.id
        })
    } catch (error) {
        if(error.name === "CannotBookingError"){
            return res.sendStatus(httpStatus.FORBIDDEN)
        }
        
        return res.sendStatus(httpStatus.NOT_FOUND);
    }
}

export async function putBooking(req: AuthenticatedRequest, res: Response){
    try{
        const { userId } = req;
        const { roomId } = req.body;
        const bookingId = Number(req.params.bookingId);

        if(!bookingId){
            return res.sendStatus(httpStatus.BAD_REQUEST)
        }
        
        if(!roomId) {
            return res.sendStatus(httpStatus.BAD_REQUEST)
        }
        
        const booking = await bookingService.putBookingRoom(userId, Number(roomId));

        return res.status(httpStatus.OK).send({
            bookingId: booking.id,
        });
    } catch (error) {
        if (error.name === "CannotBookingError") {
            return res.sendStatus(httpStatus.FORBIDDEN);
        }

        return res.sendStatus(httpStatus.NOT_FOUND)
    }
}