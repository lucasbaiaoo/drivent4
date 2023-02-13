import { cannotBookingError, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import roomRepository from "@/repositories/room-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function getBooking(userId: number){
    const booking = await bookingRepository.findByUserId(userId)

    if(!booking) {
        throw notFoundError();
    }

    return booking
}

async function checkEnrollmentTicket(userId: number){
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

    if(!enrollment){
        throw cannotBookingError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

    if(!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel){
        throw cannotBookingError();
    }
}

async function checkValidBooking(roomId: number){
    const room = await roomRepository.findRoomById(roomId);
    const bookings = await bookingRepository.findRoomById(roomId);

    if(!room){
        throw notFoundError();
    }

    if(room.capacity <= bookings.length){
        throw cannotBookingError();
    }
}

async function postBookingRoom(userId: number, roomId: number){
    await checkEnrollmentTicket(userId);
    await checkValidBooking(roomId);

    return bookingRepository.createBooking(userId, roomId)
}

async function putBookingRoom(userId: number, roomId: number){
    await checkValidBooking(roomId);

    const booking = await bookingRepository.findByUserId(userId);
    const id = booking.id;

    if(!booking || booking.userId !== userId) {
        throw cannotBookingError();
    }

    return bookingRepository.upsertBooking(roomId, userId, id)
}

const bookingService = {
    getBooking,
    postBookingRoom,
    putBookingRoom,
};


export default bookingService;